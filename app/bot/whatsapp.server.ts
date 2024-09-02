import qrcode from "qrcode-terminal";
import whatsapp from "whatsapp-web.js";
import { MongoStore } from "wwebjs-mongo";
import { mongodb } from "../services/db.server";

export class WhatsAppSession {
  private initialized: boolean = false;
  private qrCode: string = "";
  private readonly sessionId: string = "";

  private options: whatsapp.ClientOptions | undefined;
  private client: whatsapp.Client | undefined;

  private readonly onQRCodeGenerated: (qr: string) => void;
  private readonly onClientReady: () => void;

  constructor(
    sessionId: string,
    onQRCodeGenerated: (qr: string) => void,
    onClientReady: () => void
  ) {
    this.sessionId = sessionId;

    this.onQRCodeGenerated = onQRCodeGenerated;
    this.onClientReady = onClientReady;
  }

  async initialize() {
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
      console.error(error);
    }
  }

  getSessionId() {
    return this.sessionId;
  }

  getQrCode() {
    return this.qrCode;
  }

  getClient() {
    return this.client;
  }

  async restartClient() {
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

  async killClient() {
    if (!this.initialized) {
      return;
    }

    await this.client!.destroy();
  }

  private registerEventHandlers() {
    if (!this.initialized) {
      return;
    }

    this.client!.on("qr", (qr) => {
      this.qrCode = qr;

      if (process.env.NODE_ENV !== "production") {
        qrcode.generate(qr, { small: true });
      }

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

class WhatsAppManager {
  public readonly sessions: { [key: string]: WhatsAppSession } = {};

  constructor() {
    return this;
  }

  async createClient(
    sessionId: string,
    qrCallback: (qr: string) => void,
    readyCallback: () => void
  ) {
    const session = new WhatsAppSession(sessionId, qrCallback, readyCallback);

    await session.initialize();

    this.sessions[sessionId] = session;

    return session;
  }

  getClient = (sessionId: string) => {
    return this.sessions[sessionId];
  };
}

export const whatsappManager = new WhatsAppManager();
