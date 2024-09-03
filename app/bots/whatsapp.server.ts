import whatsapp from "whatsapp-web.js";
import { MongoStore } from "wwebjs-mongo";
import { mongodb } from "~/services/db.server";
import { redis } from "~/services/redis.server";
import { v6 } from "uuid";
import { Mongoose } from "mongoose";

const BACKUP_INTERVAL = 5 * 60 * 1000;

const LOCK_KEY = (sessionId: string) => `lock:whatsapp-session:${sessionId}`;
const LOCK_INTERVAL_S = 2 * 60;
const LOCK_RENEWAL_INTERVAL_MS = 60 * 1000;

/**
 * Class representing a WhatsApp session, to control the client and session state.
 * @see https://github.com/pedroslopez/whatsapp-web.js/pull/2816
 * @see https://github.com/pedroslopez/whatsapp-web.js/pull/3200
 */
export class WhatsAppSession {
  private initialized: boolean = false;
  private qrCode: string = "";
  private readonly sessionId: string = "";

  private lockValue: string = "";
  private lockRenewalInterval: NodeJS.Timeout | undefined;

  private options: whatsapp.ClientOptions | undefined;
  private client: whatsapp.Client | undefined;
  private store: typeof MongoStore | undefined;

  private readonly onQRCodeGenerated: (qr: string) => Promise<void>;
  private readonly onAuthFailure: () => Promise<void>;
  private readonly onClientReady: () => Promise<void>;
  private readonly onClientDisconnected: () => Promise<void>;
  private readonly onMessage: (
    message: whatsapp.Message,
    client: whatsapp.Client
  ) => Promise<void>;

  private readonly mongoose: Mongoose | undefined;

  /**
   * Creates a WhatsApp session.
   * @param {string} sessionId - The session ID.
   * @param {(qr: string) => Promise<void>} onQRCodeGenerated - Callback for QR code generation.
   * @param {() => Promise<void>} onAuthFailure - Callback for when authentication fails.
   * @param {() => Promise<void>} onClientReady - Callback for when the client is ready.
   * @param {() => Promise<void>} onClientDisconnected - Callback for when the client is disconnected.
   * @param {(message: whatsapp.Message, client: whatsapp.Client) => Promise<void>} onMessage - Callback for when a message is received.
   */
  constructor(
    sessionId: string,
    mongoose: Mongoose,
    onQRCodeGenerated: (qr: string) => Promise<void>,
    onAuthFailure: () => Promise<void>,
    onClientReady: () => Promise<void>,
    onClientDisconnected: () => Promise<void>,
    onMessage: (
      message: whatsapp.Message,
      client: whatsapp.Client
    ) => Promise<void>
  ) {
    this.sessionId = sessionId;
    this.mongoose = mongoose;
    this.onQRCodeGenerated = onQRCodeGenerated;
    this.onAuthFailure = onAuthFailure;
    this.onClientReady = onClientReady;
    this.onClientDisconnected = onClientDisconnected;
    this.onMessage = onMessage;
  }

  /**
   * Initializes the WhatsApp client.
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    this.lockValue = v6();

    const acquired = await redis.set(
      LOCK_KEY(this.sessionId),
      this.lockValue,
      "EX",
      LOCK_INTERVAL_S,
      "NX"
    );

    if (!acquired) {
      throw new Error(
        `Session ${this.sessionId} is already being initialized by another server.`
      );
    }

    console.log(
      `Session lock acquired for session ${this.sessionId} with value ${this.lockValue}`
    );

    this.store = new MongoStore({ mongoose: this.mongoose });

    this.options = {
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      authStrategy: new whatsapp.RemoteAuth({
        store: this.store,
        backupSyncIntervalMs: BACKUP_INTERVAL,
      }),
    };

    this.client = new whatsapp.Client(this.options);

    try {
      await this.client.initialize();
      this.initialized = true;
      this.registerEventHandlers();
      this.startLockRenewal();
      console.log(`WhatsApp client initialized for session ${this.sessionId}`);
    } catch (error) {
      console.error(
        `Error initializing WhatsApp client for session ${this.sessionId}`
      );
      console.error(error);
    }
  }

  /**
   * Gets the session ID.
   * @returns {string} The session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Gets the QR code.
   * @returns {string} The QR code.
   */
  getQrCode(): string {
    return this.qrCode;
  }

  /**
   * Gets the WhatsApp client.
   * @returns {whatsapp.Client | undefined} The WhatsApp client.
   */
  getClient(): whatsapp.Client | undefined {
    return this.client;
  }

  /**
   * Restarts the WhatsApp client.
   * @returns {Promise<void>}
   */
  async restartClient(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.killClient();

    this.client = new whatsapp.Client(this.options!);

    this.registerEventHandlers();

    this.client
      .initialize()
      .then(() =>
        console.log(`WhatsApp client restarted for session ${this.sessionId}`)
      );
  }

  /**
   * Kills the WhatsApp client.
   * @returns {Promise<void>}
   */
  async killClient(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.client!.destroy();

    console.log(`WhatsApp client killed for session ${this.sessionId}`);

    clearInterval(this.lockRenewalInterval!);
  }

  /**
   * Starts the lock renewal interval.
   * This is used to keep the session locked while the client is running.
   * This is necessary to prevent multiple servers from trying to initialize the same session.
   * This is also used to prevent the session from being locked indefinitely if the client crashes.
   * The lock is renewed by setting the TTL of the lock key to the lock interval.
   * The lock is checked every lock renewal interval to see if it has been modified.
   * If the lock not is equals to the current value, the lock renewal interval is cleared.
   * @see https://redis.io/docs/latest/develop/use/patterns/distributed-locks/
   * @private
   */
  private startLockRenewal(): void {
    // Start the lock renewal interval
    this.lockRenewalInterval = setInterval(async () => {
      console.log(`Checking lock for session ${this.sessionId}`);

      // Get the current value of the lock
      const currentValue = await redis.get(LOCK_KEY(this.sessionId));

      // If the current value is the same as the one we set, renew the lock
      if (currentValue === this.lockValue) {
        // Set the TTL of the lock to the lock interval
        await redis.expire(LOCK_KEY(this.sessionId), LOCK_INTERVAL_S);
        console.log(`Renewed lock for session ${this.sessionId}`);
      } else {
        console.log(`This instance not is owner of session ${this.sessionId}`);
        // If the current value is different, kill the client
        await this.killClient();
      }
    }, LOCK_RENEWAL_INTERVAL_MS);
  }

  /**
   * Registers event handlers for the WhatsApp client.
   * @private
   */
  private registerEventHandlers(): void {
    if (!this.initialized || !this.client) {
      return;
    }

    this.client.on("qr", async (qr) => {
      this.qrCode = qr;

      console.log(
        `WhatsApp QR code for session ${this.sessionId} is ${this.qrCode}`
      );

      await this.onQRCodeGenerated(qr);
    });

    this.client.on("auth_failure", async () => {
      console.log(`Auth failure on session ${this.sessionId}`);
    });

    this.client.on("ready", async () => {
      console.log(`WhatsApp client is ready on session ${this.sessionId}`);

      await this.onClientReady();
    });

    this.client.on("disconnected", async () => {
      console.log(`WhatsApp client disconnected on session ${this.sessionId}`);

      await this.onClientDisconnected();
    });

    this.client.on("message", async (message) => {
      if (!this.client) {
        return;
      }

      await this.onMessage(message, this.client);
    });
  }
}

/**
 * Class representing a manager for WhatsApp sessions.
 */
class WhatsAppManager {
  public readonly sessions: { [key: string]: WhatsAppSession } = {};
  private mongoose: Mongoose | undefined;

  constructor() {
    return this;
  }

  /**
   * Creates a new WhatsApp client session.
   * @param {string} sessionId - The session ID.
   * @param {(qr: string) => Promise<void>} qrCallback - Callback for QR code generation.
   * @param {() => Promise<void>} authFailureCallback - Callback for when authentication fails.
   * @param {() => Promise<void>} readyCallback - Callback for when the client is ready.
   * @param {() => Promise<void>} disconnectedCallback - Callback for when the client is disconected.
   * @param {(message: whatsapp.Message, client: whatsapp.Client) => Promise<void>} messageCallback - Callback for when a message is received.
   * @returns {Promise<WhatsAppSession>} The created WhatsApp session.
   */
  async createClient(
    sessionId: string,
    qrCallback: (qr: string) => Promise<void>,
    authFailureCallback: () => Promise<void>,
    readyCallback: () => Promise<void>,
    disconnectedCallback: () => Promise<void>,
    messageCallback: (
      message: whatsapp.Message,
      client: whatsapp.Client
    ) => Promise<void>
  ): Promise<WhatsAppSession> {
    if (this.sessions[sessionId]) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    if (!this.mongoose) {
      this.mongoose = await mongodb();
    }

    const session = new WhatsAppSession(
      sessionId,
      this.mongoose,
      qrCallback,
      authFailureCallback,
      readyCallback,
      disconnectedCallback,
      messageCallback
    );

    await session.initialize();

    this.sessions[sessionId] = session;

    return session;
  }

  /**
   * Gets a WhatsApp client session by session ID.
   * @param {string} sessionId - The session ID.
   * @returns {WhatsAppSession | undefined} The WhatsApp session.
   */
  getClient(sessionId: string): WhatsAppSession | undefined {
    return this.sessions[sessionId];
  }
}

export const whatsappManager = new WhatsAppManager();
