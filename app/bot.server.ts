import {BotState, BotStatus} from "@prisma/client";
import {Socket} from "socket.io";
import {whatsappManager} from "~/bot/whatsapp.server";
import {getBotStates, streamBotStates, updateBotSessionById, updateBotStateById,} from "~/models/bot.server";
import {WHATSAPP_QR_SOCKET_PATH} from "~/routes";

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
  socket.emit(WHATSAPP_QR_SOCKET_PATH(sessionId), qr);
};

/**
 * Starts all bots that are currently offline.
 *
 * @param {Socket} [socket] - Optional socket to emit QR codes to.
 * @returns {Promise<void>} A promise that resolves when all offline bots are started.
 */
async function startBotsOffline(socket?: Socket): Promise<void> {
  const bots = await getBotStates(BotStatus.OFFLINE);

  if (bots.length > 0) {
    for (const bot of bots) {
      if (!bot.session.enabled) {
        continue;
      }

      await startBot(bot, socket);
    }
  }
}

/**
 * Streams bot state changes and handles them accordingly.
 *
 * @returns {Promise<void>} A promise that resolves when the bot state stream ends.
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
 * Starts a bot and sets up its WhatsApp client.
 *
 * @param {BotState} bot - The bot state to start.
 * @param {Socket} [socket] - Optional socket to emit QR codes to.
 * @returns {Promise<void>} A promise that resolves when the bot is started.
 */
async function startBot(bot: BotState, socket?: Socket): Promise<void> {
  console.log(`Starting bot: ${bot.id}`);

  try {
    whatsappManager.createClient(
      bot.sessionId,
      (qr: string) => {
        updateBotSessionById(bot.sessionId, { whatsappQr: qr });
        socket ? whatsAppQrSocketEmitter(socket, bot.sessionId, qr) : undefined;
      },
      () => updateBotStateById(bot.id, { status: BotStatus.ONLINE })
    );
  } catch (error) {
    console.error(error);
  }
}

/**
 * Kills a bot's WhatsApp client and removes its session.
 *
 * @param {string} sessionId - The session ID of the bot to kill.
 * @returns {Promise<void>} A promise that resolves when the bot is killed.
 */
async function killBot(sessionId: string): Promise<void> {
  try {
    await whatsappManager.sessions[sessionId].killClient();
    delete whatsappManager.sessions[sessionId];
  } catch (error) {
    console.log(error);
  }
}

/**
 * Main function to start offline bots and stream bot state changes.
 *
 * @param {Socket} [socket] - Optional socket to emit QR codes to.
 * @returns {Promise<void>} A promise that resolves when the bot operations are complete.
 */
export const bot = async (socket?: Socket): Promise<void> => {
  await startBotsOffline(socket);
  await streamBots();
};
