import { BotState, BotStatus } from "@prisma/client";
import { Socket } from "socket.io";
import { whatsappManager } from "~/bot/whatsapp.server";
import {
  getBotStates,
  streamBotStates,
  updateBotSessionById,
  updateBotStateById,
} from "~/models/bot.server";
import { WHATSAPP_QR_SOCKET_PATH } from "~/routes";

const whatsAppQrSocketEmitter = (
  socket: Socket,
  sessionId: string,
  qr: string
) => {
  socket.emit(WHATSAPP_QR_SOCKET_PATH(sessionId), qr);
};

async function startBotsOffline(socket?: Socket) {
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

async function streamBots() {
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

async function startBot(bot: BotState, socket?: Socket) {
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

async function killBot(sessionId: string) {
  try {
    await whatsappManager.sessions[sessionId].killClient();
    delete whatsappManager.sessions[sessionId];
  } catch (error) {
    console.log(error);
  }
}

export const bot = async (socket?: Socket) => {
  await startBotsOffline(socket);
  streamBots();
};
