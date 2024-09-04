import { redis } from "~/services/redis.server";
import { v6 } from "uuid";
import {
  AuthenticationState,
  DisconnectReason,
  makeWASocket,
  UserFacingSocketConfig,
} from "baileys";
import { MessageUpsertType, WAMessage } from "baileys/lib/Types/Message";
import { Boom } from "@hapi/boom";
import { logger } from "~/services/logger";
import { useMongoDBAuthState } from "~/extension/use-mongodb-auth-state";
import * as process from "node:process";

const LOCK_KEY = (sessionId: string) => `lock:whatsapp-session:${sessionId}`;
const LOCK_INTERVAL_S = 2 * 60;
const LOCK_RENEWAL_INTERVAL_MS = 60 * 1000;

const CREDS_DATABASE_NAME = "botai-whatsapp";
const CREDS_COLLECTION_NAME = "creds";

/**
 * Class representing a WhatsApp session, to control the client and session state.
 * @see https://github.com/pedroslopez/whatsapp-web.js/pull/2816
 * @see https://github.com/pedroslopez/whatsapp-web.js/pull/3200
 */
export class WhatsAppSession {
  private readonly sessionId: string = "";

  private initialized: boolean = false;
  private qrCode: string | undefined;

  private lockValue: string = "";
  private lockRenewalInterval: NodeJS.Timeout | undefined;

  private config: UserFacingSocketConfig | undefined;
  private client: ReturnType<typeof makeWASocket> | undefined | null;

  private state: AuthenticationState | undefined;
  private saveCreds: (() => Promise<void>) | undefined;

  private readonly onQRCodeGenerated: (qr: string) => Promise<void>;
  private readonly onAuthFailure: () => Promise<void>;
  private readonly onClientReady: () => Promise<void>;
  private readonly onClientDisconnected: () => Promise<void>;
  private readonly onMessage: (
    message: {
      messages: WAMessage[];
      type: MessageUpsertType;
      requestId?: string;
    },
    client: ReturnType<typeof makeWASocket>
  ) => Promise<void>;

  /**
   * Creates a WhatsApp session.
   * @param {string} sessionId - The session ID.
   * @param {(qr: string) => Promise<void>} onQRCodeGenerated - Callback for QR code generation.
   * @param {() => Promise<void>} onAuthFailure - Callback for when authentication fails.
   * @param {() => Promise<void>} onClientReady - Callback for when the client is ready.
   * @param {() => Promise<void>} onClientDisconnected - Callback for when the client is disconnected.
   * @param {(message: object, client:  ReturnType<typeof makeWASocket>) => Promise<void>} onMessage - Callback for when a message is received.
   */
  constructor(
    sessionId: string,
    onQRCodeGenerated: (qr: string) => Promise<void>,
    onAuthFailure: () => Promise<void>,
    onClientReady: () => Promise<void>,
    onClientDisconnected: () => Promise<void>,
    onMessage: (
      message: {
        messages: WAMessage[];
        type: MessageUpsertType;
        requestId?: string;
      },
      client: ReturnType<typeof makeWASocket>
    ) => Promise<void>
  ) {
    this.sessionId = sessionId;
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
        `Session ${this.sessionId} is already being initialized by another server`
      );
    }

    logger.info(
      `Session lock acquired for session ${this.sessionId} with value ${this.lockValue}`
    );

    // eslint-disable-next-line
    const { state, saveCreds } = await useMongoDBAuthState({
      mongodbUri: process.env.MONGO_URI!,
      databaseName: CREDS_DATABASE_NAME,
      collectionName: CREDS_COLLECTION_NAME,
      sessionId: this.sessionId,
    });

    this.state = state;
    this.saveCreds = saveCreds;

    this.config = {
      auth: this.state,
      qrTimeout: undefined,
      defaultQueryTimeoutMs: undefined,
    } as UserFacingSocketConfig;

    try {
      this.client = makeWASocket(this.config);
      this.registerEventHandlers();
      this.startLockRenewal();
    } catch (error) {
      logger.error(
        `Error initializing WhatsApp client for session ${this.sessionId}`,
        error
      );
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
  getQrCode(): string | undefined {
    return this.qrCode;
  }

  /**
   * Gets the WhatsApp client.
   * @returns { ReturnType<typeof makeWASocket> | undefined} The WhatsApp client.
   */
  getClient(): ReturnType<typeof makeWASocket> | undefined | null {
    return this.client;
  }

  /**
   * Restarts the WhatsApp client.
   * @returns {Promise<void>}
   */
  async restartClient(): Promise<void> {
    if (!this.initialized || !this.config) {
      return;
    }

    logger.info(`Restarting WhatsApp client for session ${this.sessionId}`);

    try {
      await this.killClient();

      this.client = makeWASocket(this.config);
      this.registerEventHandlers();

      logger.info(`WhatsApp client restarted for session ${this.sessionId}`);
    } catch (error) {
      logger.error(
        `Error on restarting WhatsApp client for session ${this.sessionId}`,
        error
      );
    }
  }

  /**
   * Kills the WhatsApp client.
   * @returns {Promise<void>}
   */
  async killClient(): Promise<void> {
    if (!this.initialized || !this.client) {
      return;
    }

    this.client.end(new Error(`Killing client for session ${this.sessionId}`));

    this.client = null;
    clearInterval(this.lockRenewalInterval!);

    logger.info(`WhatsApp client killed for session ${this.sessionId}`);
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
      logger.info(`Checking lock for session ${this.sessionId}`);

      // Get the current value of the lock
      const currentValue = await redis.get(LOCK_KEY(this.sessionId));

      // If the current value is the same as the one we set, renew the lock
      if (currentValue === this.lockValue) {
        // Set the TTL of the lock to the lock interval
        await redis.expire(LOCK_KEY(this.sessionId), LOCK_INTERVAL_S);
        logger.info(`Renewed lock for session ${this.sessionId}`);
      } else {
        logger.info(`This instance not is owner of session ${this.sessionId}`);
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
    if (!this.client) {
      return;
    }

    this.client.ev.on("connection.update", async (update) => {
      if (!this.client) {
        return;
      }

      this.initialized = true;

      const { qr, connection, lastDisconnect } = update;

      if (qr) {
        this.qrCode = qr;

        logger.info(
          `WhatsApp QR code for session ${this.sessionId} is ${this.qrCode}`
        );

        await this.onQRCodeGenerated(qr);
      }

      if (connection === "close") {
        if (lastDisconnect) {
          const reason = new Boom(lastDisconnect.error).output.statusCode;

          switch (reason) {
            case DisconnectReason.restartRequired:
              logger.warn(`Restart required on session ${this.sessionId}`);
              await this.restartClient();
              break;
            case DisconnectReason.badSession:
              logger.error(`Bad session file on session ${this.sessionId}`);
              break;
            case DisconnectReason.connectionClosed:
              logger.info(`Connection closed on session ${this.sessionId}`);
              await this.restartClient();
              break;
            case DisconnectReason.connectionLost:
              logger.info(`Connection lost on session ${this.sessionId}`);
              await this.restartClient();
              break;
            case DisconnectReason.connectionReplaced:
              logger.error(
                `Connection replaced should delete session file of session ${this.sessionId}`
              );
              break;
            case DisconnectReason.loggedOut:
              logger.warn(`Logged out on session ${this.sessionId}`);
              await this.onClientDisconnected();
              break;
            case DisconnectReason.timedOut:
              logger.warn(`Connection timed out on session ${this.sessionId}`);

              await this.restartClient();
              break;
            case DisconnectReason.unavailableService:
              logger.error(
                `WhatsApp service unavailable on session ${this.sessionId}`
              );

              await this.onClientDisconnected();
              break;
            case DisconnectReason.forbidden:
              logger.error(
                `WhatsApp service forbidden on session ${this.sessionId}`
              );

              await this.onClientDisconnected();
              break;
            case DisconnectReason.multideviceMismatch:
              logger.warn(
                `WhatsApp multi-device mismatch on session ${this.sessionId}`
              );

              await this.onClientDisconnected();
              break;
            default:
              this.client.end(
                new Error(`Unknown error occurred on session ${this.sessionId}`)
              );

              await this.onClientDisconnected();
              break;
          }
        }
      } else if (connection === "open") {
        logger.info(
          `WhatsApp client initialized for session ${this.sessionId}`
        );

        await this.onClientReady();
      }
    });

    this.client.ev.on("messages.upsert", async (m) => {
      if (!this.client) {
        return;
      }

      await this.onMessage(m, this.client);
    });

    this.client.ev.on("creds.update", this.saveCreds!);
  }
}

/**
 * Class representing a manager for WhatsApp sessions.
 */
class WhatsAppManager {
  public readonly sessions: { [key: string]: WhatsAppSession } = {};

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
   * @param {(message: object, client:  ReturnType<typeof makeWASocket>) => Promise<void>} messageCallback - Callback for when a message is received.
   * @returns {Promise<WhatsAppSession>} The created WhatsApp session.
   */
  async createClient(
    sessionId: string,
    qrCallback: (qr: string) => Promise<void>,
    authFailureCallback: () => Promise<void>,
    readyCallback: () => Promise<void>,
    disconnectedCallback: () => Promise<void>,
    messageCallback: (
      message: {
        messages: WAMessage[];
        type: MessageUpsertType;
        requestId?: string;
      },
      client: ReturnType<typeof makeWASocket>
    ) => Promise<void>
  ): Promise<WhatsAppSession> {
    if (this.sessions[sessionId]) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const session = new WhatsAppSession(
      sessionId,
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
