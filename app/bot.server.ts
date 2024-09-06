import {BotState, BotStatus} from "@prisma/client";
import {whatsappManager} from "~/bots/whatsapp.server";
import {
  getBotSessionById,
  getBotStates,
  streamBotStates,
  updateBotSessionById,
  updateBotStateById,
} from "~/models/bot.server";
import {logger} from "~/logger";

/**
 * Starts all bots enabled.
 *
 * @returns {Promise<void>} A promise that resolves all bots enabled.
 */
async function startBots(): Promise<void> {
  const bots = await getBotStates();

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
 *
 * @see https://www.prisma.io/docs/pulse
 * @returns {Promise<void>} A promise that resolves when the bots state stream ends.
 */
async function streamBots(): Promise<void> {
  const botsStream = await streamBotStates();

  for await (const botEvent of botsStream) {
    switch (botEvent.action) {
      case "create": {
        await startBot(botEvent.created);
        break;
      }
      case "update": {
        const bot = await getBotSessionById(botEvent.after.sessionId);
        if (bot && !bot.enabled) {
          await killBot(botEvent.after.sessionId);
        }

        if (botEvent.after.status === BotStatus.OFFLINE) {
          await startBot(botEvent.after);
        }
        break;
      }
      case "delete": {
        await killBot(botEvent.deleted.id);
        break;
      }
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
      bot.id,
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
        console.log(message.messages[0].message?.conversation);
        if (
          !message.messages[0].key.fromMe &&
          message.messages[0].message?.conversation?.includes("Oi")
        ) {
          await client.sendMessage(message.messages[0].key.remoteJid!, {
            text: "Olá",
          });
        }
      }
    );
  } catch (error) {
    logger.error(`Failed to start bot ${bot.id}`);

    if (error instanceof Error) {
      logger.error(error.message);
    }
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
    await whatsappManager.killClient(sessionId);
  } catch (error) {
    logger.error(`Failed to kill bot ${sessionId}`, error);
  }
}

/**
 * Stops all bots and kills their WhatsApp clients.
 *
 * @returns {Promise<void>} A promise that resolves when all bots are stopped.
 */
async function stopBots(): Promise<void> {
  // Iterate over all WhatsApp client sessions
  for (const session of whatsappManager.getClients()) {
    // Kill the WhatsApp client
    await session.killClient();

    // Update the bot state to OFFLINE
    await updateBotStateById(session.getBotId(), {
      status: BotStatus.OFFLINE,
    });
  }
}

/**
 * Main function to start offline bots and stream bots state changes.
 *
 * @returns {Promise<void>} A promise that resolves when the bots operations are complete.
 */
export const handleBot = async (): Promise<void> => {
  await startBots();
  await streamBots();

  handleBotProcess();
};

function handleBotProcess() {
  process.on("exit", async (code) => {
    await stopBots();
    logger.warn(`Process exit event with code ${code}`);
  });

  process.on("SIGTERM", async (signal) => {
    await stopBots();
    logger.warn(`Process ${process.pid} has been killed`, signal);
    process.exit(0);
  });

  process.on("SIGINT", async (signal) => {
    await stopBots();
    logger.warn(`Process ${process.pid} has been interrupted`, signal);
    process.exit(0);
  });

  process.on("uncaughtException", async (error) => {
    await stopBots();
    logger.warn(`Uncaught exception`, error.message);
    process.exit(1);
  });
}
