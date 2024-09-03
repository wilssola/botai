import {BotState, BotStatus} from "@prisma/client";
import {Socket} from "socket.io";
import {whatsappManager} from "~/bots/whatsapp.server";
import {getBotStates, streamBotStates, updateBotSessionById, updateBotStateById,} from "~/models/bot.server";
import {
  WHATSAPP_CHAT_RECEIVE_SOCKET_EVENT,
  WHATSAPP_CHAT_SEND_SOCKET_EVENT,
  WHATSAPP_QR_SOCKET_EVENT,
} from "~/constants/events";

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
 * Streams bots state changes and handles them accordingly.
 * @see https://www.prisma.io/docs/pulse
 * @returns {Promise<void>} A promise that resolves when the bots state stream ends.
 */
async function streamBots(socket?: Socket): Promise<void> {
  const botsStream = await streamBotStates();

  for await (const botEvent of botsStream) {
    switch (botEvent.action) {
      case "create":
        await startBot(botEvent.created, socket);
        break;
      case "update":
        if (botEvent.after.status === BotStatus.OFFLINE) {
          await startBot(botEvent.after, socket);
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
 * @param {Socket} [socket] - Optional socket to emit QR codes to.
 * @returns {Promise<void>} A promise that resolves when the bots is started.
 */
async function startBot(bot: BotState, socket?: Socket): Promise<void> {
  console.log(`Starting bot: ${bot.id}`);

  try {
    await whatsappManager.createClient(
      bot.sessionId,
      async (qr) => {
        await updateBotSessionById(bot.sessionId, { whatsappQr: qr });
        //socket ? whatsAppQrSocketEmitter(socket, bot.sessionId, qr) : undefined;
      },
      async () => {
        await updateBotStateById(bot.id, { status: BotStatus.ONLINE });
      },
      async () => {
        await updateBotStateById(bot.id, { status: BotStatus.OFFLINE });
      },
      async (message, client) => {
        socket?.emit(
          WHATSAPP_CHAT_RECEIVE_SOCKET_EVENT(bot.sessionId),
          message.body
        );

        if (message.body.includes("Oi")) {
          socket?.emit(WHATSAPP_CHAT_SEND_SOCKET_EVENT(bot.sessionId), "Olá!");

          await client.sendMessage(message.from, "Olá!");
        }
      }
    );
  } catch (error) {
    console.error(`Failed to start bot: ${bot.id}`);
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
    console.error(`Failed to kill bot: ${sessionId}`, error);
  }
}

/**
 * Main function to start offline bots and stream bots state changes.
 *
 * @param {Socket} [socket] - Optional socket to emit QR codes to.
 * @returns {Promise<void>} A promise that resolves when the bots operations are complete.
 */
export const bot = async (socket?: Socket): Promise<void> => {
  await startBotsOffline(socket);
  await streamBots();
};
