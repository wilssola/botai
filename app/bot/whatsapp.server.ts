import whatsapp from "whatsapp-web.js";
import {MongoStore} from "wwebjs-mongo";
import {mongodb} from "~/services/db.server";

/**
 * Class representing a WhatsApp session, to control the client and session state.
 * @see https://github.com/pedroslopez/whatsapp-web.js/pull/2816
 */
export class WhatsAppSession {
  private initialized: boolean = false;
  private qrCode: string = "";
  private readonly sessionId: string = "";

  private options: whatsapp.ClientOptions | undefined;
  private client: whatsapp.Client | undefined;

  private readonly onQRCodeGenerated: (qr: string) => void;
  private readonly onClientReady: () => void;

  /**
   * Creates a WhatsApp session.
   * @param {string} sessionId - The session ID.
   * @param {(qr: string) => void} onQRCodeGenerated - Callback for QR code generation.
   * @param {() => void} onClientReady - Callback for when the client is ready.
   */
  constructor(
    sessionId: string,
    onQRCodeGenerated: (qr: string) => void,
    onClientReady: () => void
  ) {
    this.sessionId = sessionId;
    this.onQRCodeGenerated = onQRCodeGenerated;
    this.onClientReady = onClientReady;
  }

  /**
   * Initializes the WhatsApp client.
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    const mongoose = await mongodb();

    this.options = {
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      authStrategy: new whatsapp.RemoteAuth({
        store: new MongoStore({ mongoose }),
        backupSyncIntervalMs: 300000,
      }),
    };

    this.client = new whatsapp.Client(this.options);

    try {
      await this.client.initialize();
      this.initialized = true;
      this.registerEventHandlers();
      console.log(`WhatsApp client initialized for session: ${this.sessionId}`);
    } catch (error) {
      console.error(
        `Error initializing WhatsApp client for session: ${this.sessionId}`,
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
        console.log(`WhatsApp client restarted for session: ${this.sessionId}`)
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
  }

  /**
   * Registers event handlers for the WhatsApp client.
   * @private
   */
  private registerEventHandlers(): void {
    if (!this.initialized) {
      return;
    }

    this.client!.on("qr", (qr) => {
      this.qrCode = qr;

      console.log(`WhatsApp QR code for session: ${this.sessionId}`, qr);

      this.onQRCodeGenerated(qr);
    });

    this.client!.on("ready", () => {
      console.log(`WhatsApp client is ready on session: ${this.sessionId}`);
      this.onClientReady();
    });

    this.client!.on("disconnected", () => {});

    this.client!.on("message", (message) => {
      if (message.body.includes("Oi")) {
        this.client!.sendMessage(message.from, "Olá!");
      }
    });
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
   * @param {(qr: string) => void} qrCallback - Callback for QR code generation.
   * @param {() => void} readyCallback - Callback for when the client is ready.
   * @returns {Promise<WhatsAppSession>} The created WhatsApp session.
   */
  async createClient(
    sessionId: string,
    qrCallback: (qr: string) => void,
    readyCallback: () => void
  ): Promise<WhatsAppSession> {
    const session = new WhatsAppSession(sessionId, qrCallback, readyCallback);

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
