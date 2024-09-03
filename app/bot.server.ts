import {BotState, BotStatus} from "@prisma/client";
import {Socket} from "socket.io";
import {whatsappManager} from "~/bots/whatsapp.server";
import {getBotStates, streamBotStates, updateBotSessionById, updateBotStateById,} from "~/models/bot.server";
import {WHATSAPP_QR_SOCKET_EVENT} from "~/constants/events";

/**
 * Emits a WhatsApp QR code to the specified socket.
 *
 * @param {Socket} socket - The socket to emit the QR code to.
 * @param {string} sessionId - The session ID associated with the QR code.
 * @param {string} qr - The QR code to emit.
 */
const whatsAppQrSocketEmitter = (
  socket: Socket,
  sessionId: string,
  qr: string
) => {
  socket.emit(WHATSAPP_QR_SOCKET_EVENT(sessionId), qr);
};

/**
 * Starts all bots that are currently offline.
 *
 * @returns {Promise<void>} A promise that resolves when all offline bots are started.
 */
async function startBotsOffline(): Promise<void> {
  const bots = await getBotStates(BotStatus.OFFLINE);

  if (bots.length > 0) {
    for (const bot of bots) {
      if (!bot.session.enabled) {
        continue;
      }

      await startBot(bot);
    }
  }
}

/**
 * Streams bots state changes and handles them accordingly.
 * @see https://www.prisma.io/docs/pulse
 * @returns {Promise<void>} A promise that resolves when the bots state stream ends.
 */
async function streamBots(): Promise<void> {
  const botsStream = await streamBotStates();

  for await (const botEvent of botsStream) {
    switch (botEvent.action) {
      case "create":
        await startBot(botEvent.created);
        break;
      case "update":
        if (botEvent.after.status === BotStatus.OFFLINE) {
          await startBot(botEvent.after);
        }
        break;
      case "delete":
        await killBot(botEvent.deleted.id);
        break;
    }
  }
}

/**
 * Starts a bots and sets up its WhatsApp client.
 *
 * @param {BotState} bot - The bots state to start.
 * @returns {Promise<void>} A promise that resolves when the bots is started.
 */
async function startBot(bot: BotState): Promise<void> {
  console.log(`Starting bot ${bot.id} for session ${bot.sessionId}`);

  try {
    await whatsappManager.createClient(
      bot.sessionId,
      async (qr) => {
        await updateBotSessionById(bot.sessionId, { whatsappQr: qr });
      },
      async () => {
        await updateBotStateById(bot.id, { status: BotStatus.OFFLINE });
      },
      async () => {
        await updateBotStateById(bot.id, { status: BotStatus.ONLINE });
      },
      async () => {
        await updateBotStateById(bot.id, { status: BotStatus.OFFLINE });
      },
      async (message, client) => {
        if (message.body.includes("Oi")) {
          await client.sendMessage(message.from, "Olá!");
        }
      }
    );
  } catch (error) {
    console.error(`Failed to start bot ${bot.id}`);
    console.error(error);
  }
}

/**
 * Kills a bots's WhatsApp client and removes its session.
 *
 * @param {string} sessionId - The session ID of the bots to kill.
 * @returns {Promise<void>} A promise that resolves when the bots is killed.
 */
async function killBot(sessionId: string): Promise<void> {
  try {
    await whatsappManager.sessions[sessionId].killClient();
    delete whatsappManager.sessions[sessionId];
  } catch (error) {
    console.error(`Failed to kill bot ${sessionId}`, error);
  }
}

/**
 * Main function to start offline bots and stream bots state changes.
 *
 * @returns {Promise<void>} A promise that resolves when the bots operations are complete.
 */
export const bot = async (): Promise<void> => {
  await startBotsOffline();
  //await streamBots();
};
