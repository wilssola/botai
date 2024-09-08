import { BotCommand, BotState, BotStatus } from "@prisma/client";
import { whatsappManager } from "~/bots/whatsapp.server";
import {
  getBotCommandsBySessionId,
  getBotSessionById,
  getBotStates,
  updateBotSessionById,
  updateBotStateById,
} from "~/models/bot.server";
import { logger } from "~/logger";
import { askAI } from "~/services/ai.server";
import { redis } from "~/services/redis.server";
import stringSimilarity from "string-similarity";

let previousBotStates: BotState[] = [];

function compareBotStates(previous: BotState[], current: BotState[]) {
  const previousIds = new Set(previous.map((bot) => bot.id));
  const currentIds = new Set(current.map((bot) => bot.id));

  // Detect created bots
  const createdBots = current.filter((bot) => !previousIds.has(bot.id));
  createdBots.forEach((bot) => startBot(bot));

  // Detect deleted bots
  const deletedBots = previous.filter((bot) => !currentIds.has(bot.id));
  deletedBots.forEach((bot) => killBot(bot.id));

  // Detect updated bots
  const updatedBots = current.filter((bot) => {
    const previousBot = previous.find((pBot) => pBot.id === bot.id);
    return (
      previousBot &&
      (previousBot.status !== bot.status ||
        previousBot.sessionId !== bot.sessionId)
    );
  });

  updatedBots.forEach(async (bot) => {
    const session = await getBotSessionById(bot.sessionId);
    if (session && !session.enabled) {
      await killBot(bot.sessionId);
    }
    if (bot.status === BotStatus.OFFLINE) {
      await startBot(bot);
    }
  });
}

async function monitorBotStates() {
  try {
    const currentBotStates = await getBotStates();
    compareBotStates(previousBotStates, currentBotStates);
    previousBotStates = currentBotStates;
  } catch (error) {
    logger.error("Error monitoring bot states", error);
  }
}

/**
 * Starts a bots and sets up its WhatsApp client.
 *
 * @param {BotState} bot - The bots state to start.
 * @returns {Promise<void>} A promise that resolves when the bots is started.
 */
async function startBot(bot: BotState): Promise<void> {
  logger.info(`Starting bot ${bot.id} for session ${bot.sessionId}`);

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
        if (!message.messages[0].key.fromMe) {
          await sendBotMessage(
            bot.sessionId,
            message.messages[0].message!.conversation!,
            async (response) => {
              await client.sendMessage(message.messages[0].key.remoteJid!, {
                text: response,
              });
            }
          );
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

async function sendBotMessage(
  sessionId: string,
  message: string,
  sendFunction: (response: string) => Promise<void>
) {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizedMessage = normalize(message);
  const words = normalizedMessage.split(" ");

  const botCommands = await getBotCommandsBySessionId(sessionId);
  for (const botCommand of botCommands) {
    console.log("botCommand", botCommand);
    const inputs = botCommand.inputs.map((input) => normalize(input));
    const match = words.some((word) => {
      const similarities = inputs.map((input) =>
        stringSimilarity.compareTwoStrings(word, input)
      );

      return Math.max(...similarities) > 0.8; // Ajuste o limiar conforme necessário
    });

    if (match) {
      console.log("match", match);
      await handleBotResponse(sessionId, message, botCommand, sendFunction);
      break;
    }
  }
}

async function handleBotResponse(
  sessionId: string,
  message: string,
  botCommand: BotCommand,
  sendFunction: (response: string) => Promise<void>
) {
  if (botCommand.enableAi) {
    const response = await getAiResponse(
      sessionId,
      botCommand.id,
      botCommand.promptAi && botCommand.promptAi.length > 0
        ? `${botCommand.promptAi} ${botCommand.output}`
        : botCommand.output,
      message
    );

    if (response) {
      await sendFunction(response);
    }
    return;
  }

  if (botCommand.output && botCommand.output.length > 0) {
    await sendFunction(botCommand.output);
  }
}

async function getAiResponse(
  sessionId: string,
  commandId: string,
  prompt: string,
  message: string
) {
  const CACHE_KEY = `cache:ai-response:${sessionId}:${commandId}`;
  const CACHE_INTERVAL_S = 60;

  const SYSTEM_PROMPT =
    "Você é um assistente de IA. Evite responder perguntas pessoais, filosóficas ou religiosas. Responda a perguntas de forma objetiva e educada. Use emojis sempre que possível. Siga as regras complementares as seguir:";

  const cachedResponse = await redis.get(CACHE_KEY);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await askAI(`${SYSTEM_PROMPT} ${prompt}`, message);
  if (response) {
    await redis.set(CACHE_KEY, response, "EX", CACHE_INTERVAL_S);
  }

  return response;
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
  setInterval(monitorBotStates, 10000);
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
