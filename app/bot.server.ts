import { BotState, BotStatus } from "@prisma/client";
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

/**
 * Compares the previous and current bot states to detect created, deleted, and updated bots.
 *
 * The comparison is done by comparing the IDs of the bot states. The following cases are detected:
 *  1. Created bots: The ID does not exist in the previous bot states.
 *  2. Deleted bots: The ID does not exist in the current bot states.
 *  3. Updated bots: The status or session ID of the bot has changed.
 *
 * @param {BotState[]} previous - The previous bot states.
 * @param {BotState[]} current - The current bot states.
 */
function compareBotStates(previous: BotState[], current: BotState[]) {
  const previousIds = new Set(previous.map((bot) => bot.id));
  const currentIds = new Set(current.map((bot) => bot.id));

  // Detect created bots.
  const createdBots = current.filter((bot) => !previousIds.has(bot.id));
  // Start the created bots.
  createdBots.forEach((bot) => startBot(bot));

  // Detect deleted bots.
  const deletedBots = previous.filter((bot) => !currentIds.has(bot.id));
  // Kill the deleted bots.
  deletedBots.forEach((bot) => killBot(bot.id));

  // Detect updated bots.
  const updatedBots = current.filter((bot) => {
    // Find the corresponding previous bot state.
    const previousBot = previous.find((pBot) => pBot.id === bot.id);
    // Check if the status or session ID of the bot has changed.
    return (
      previousBot &&
      (previousBot.status !== bot.status ||
        previousBot.sessionId !== bot.sessionId)
    );
  });

  // Update the updated bots.
  updatedBots.forEach(async (bot) => {
    // Get the bot session.
    const session = await getBotSessionById(bot.sessionId);
    // If the session is disabled, kill the bot.
    if (session && !session.enabled) {
      await killBot(bot.sessionId);
    }
    // If the bot status is OFFLINE, start the bot.
    if (bot.status === BotStatus.OFFLINE) {
      await startBot(bot);
    }
  });
}

/**
 * Monitors the bot states and compares them with the previous states.
 *
 * This function is called at regular intervals to detect changes in the bot states.
 * It compares the current bot states with the previous bot states and starts, stops,
 * or updates bots accordingly.
 */
async function monitorBotStates(): Promise<void> {
  try {
    const currentBotStates = await getBotStates();

    // Compare the current bot states with the previous bot states.
    // This will detect created, deleted, and updated bots.
    compareBotStates(previousBotStates, currentBotStates);

    // Update the previous bot states with the current bot states.
    previousBotStates = currentBotStates;
  } catch (error) {
    // Log any errors that occur while monitoring the bot states.
    logger.error(`Error monitoring bot states: ${error}`);
  }
}

/**
 *
 * @param {BotState} bot - The bot state to start.
 * @returns {Promise<void>} A promise that resolves when the bot is started.
 */
async function startBot(bot: BotState): Promise<void> {
  logger.info(`Starting bot ${bot.id} for session ${bot.sessionId}`);

  try {
    // Create a new WhatsApp client using the bot's session ID.
    await whatsappManager.createClient(
      // The bot ID.
      bot.id,
      // The session ID.
      bot.sessionId,
      // The callback for when a QR code is generated.
      async (qr) => {
        // Update the bot session with the QR code.
        await updateBotSessionById(bot.sessionId, {
          whatsappQr: qr,
        });
      },
      // The callback for when the authentication fails.
      async () => {
        // Update the bot state to OFFLINE if the authentication fails.
        await updateBotStateById(bot.id, { status: BotStatus.OFFLINE });
      },
      // The callback for when the client is ready.
      async () => {
        // Update the bot state to ONLINE if the client is ready.
        await updateBotStateById(bot.id, { status: BotStatus.ONLINE });
      },
      // The callback for when the client is disconnected.
      async () => {
        // Update the bot state to OFFLINE if the client is disconnected.
        await updateBotStateById(bot.id, { status: BotStatus.OFFLINE });
      },
      // The callback for when a message is received.
      async (message, client) => {
        // Get the last message from the message list.
        const lastMessage = message.messages[0];

        // Check if the message is from the user.
        if (!lastMessage.key.fromMe) {
          // Check if the message has a conversation.
          if (lastMessage.message?.conversation) {
            // Get the text of the conversation.
            const text = lastMessage.message?.conversation;

            if (!text) {
              return;
            }

            // Send the message to the bot.
            await sendBotMessage(bot.sessionId, text, async (response) => {
              // Send the response as a message to the user.
              await client.sendMessage(lastMessage.key.remoteJid!, {
                text: response,
              });
            });
          }
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
 * Represents a stored message in the bot chat.
 */
export type StoredMessage = {
  /**
   * Unique identifier for the message.
   */
  id: string;

  /**
   * Identifier of the sender, if available.
   */
  senderId?: string;

  /**
   * Indicates whether the message was sent by the bot itself.
   */
  fromMe?: boolean;

  /**
   * The actual message text, if available.
   */
  message?: string;
};

/**
 * The key used to store the bot chat messages in Redis.
 * The format is `cache:bot-chat-messages:<sessionId>`.
 *
 * @param {string} sessionId - The bot session ID.
 * @returns {string} The cache key.
 */
export const MESSAGES_CACHE_KEY = (sessionId: string): string =>
  `cache:bot-chat-messages:${sessionId}`;

const MESSAGES_CACHE_INTERVAL_S = 24 * 3600;

/**
 * Stores the given messages in the Redis cache for the given bot session ID.
 * The messages are stored as a JSON string and are valid for 24 hours.
 *
 * @param {string} sessionId - The bot session ID.
 * @param {StoredMessage[]} messages - The messages to store.
 */
async function storeBotMessage(sessionId: string, messages: StoredMessage[]) {
  await redis.set(
    MESSAGES_CACHE_KEY(sessionId),
    JSON.stringify(messages),
    "EX",
    MESSAGES_CACHE_INTERVAL_S
  );
}

/**
 * Sends a bot message based on the received message and bot commands.
 *
 * @param {string} sessionId - The session ID.
 * @param {string} message - The received message.
 * @param {(response: string) => Promise<void>} sendFunction - The function to send the response.
 */
async function sendBotMessage(
  sessionId: string,
  message: string,
  sendFunction: (response: string) => Promise<void>
): Promise<void> {
  /**
   * Normalize the given string by removing diacritics and punctuation.
   * @param {string} str - The string to normalize.
   * @returns {string} The normalized string.
   */
  const normalize = (str: string): string =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizedMessage = normalize(message);
  const words = normalizedMessage.split(" ");

  const session = await getBotSessionById(sessionId);
  const botCommands = await getBotCommandsBySessionId(sessionId);

  // Sort the bot commands by priority in descending order.
  botCommands.sort((a, b) => b.priority - a.priority);

  let match = false;
  for (const botCommand of botCommands) {
    /**
     * Normalize the input commands and compare them to the normalized message.
     * If the similarity between the input and any of the words is higher than 0.8,
     * it's considered a match.
     */
    const inputs = botCommand.inputs.map((input) => normalize(input));
    match = words.some((word) => {
      const similarities = inputs.map((input) =>
        stringSimilarity.compareTwoStrings(word, input)
      );

      return Math.max(...similarities) > 0.8; // Adjust the threshold as needed.
    });

    if (match) {
      await handleBotResponse(
        sessionId,
        message,
        sendFunction,
        botCommand.id,
        botCommand.output,
        botCommand.enableAi,
        botCommand.promptAi
      );
      break;
    }
  }

  // If no match was found, send a default response.
  if (!match && session) {
    await handleBotResponse(
      sessionId,
      message,
      sendFunction,
      "default",
      null,
      session.enableAi,
      session.promptAi
    );
  }
}

/**
 * Handles the bot response based on the bot command.
 *
 * @param {string} sessionId - The session ID.
 * @param {string} message - The received message.
 * @param {(response: string) => Promise<void>} sendFunction - The function to send the response.
 * @param commandId - The command ID.
 * @param output - The output of the bot command.
 * @param enableAi - Whether to enable AI for the bot command.
 * @param promptAi - The prompt for the AI.
 */
async function handleBotResponse(
  sessionId: string,
  message: string,
  sendFunction: (response: string) => Promise<void>,
  commandId: string | "default",
  output?: string | null,
  enableAi?: boolean,
  promptAi?: string | null
): Promise<void> {
  // If the bot command is using AI, get the AI response
  if (enableAi) {
    const response = await getAiResponse(
      sessionId,
      commandId,
      promptAi && promptAi.length > 0
        ? `${promptAi} | ${output}`
        : output ?? "",
      message
    );

    // If an AI response is found, send it
    if (response) {
      await sendFunction(response);
    }

    return;
  }

  // If the bot command is not using AI, send the output if it exists
  if (output && output.length > 0) {
    await sendFunction(output);
  }
}

/**
 * Gets the cache key for the AI response based on the session ID and command ID.
 *
 * @param {string} sessionId - The session ID.
 * @param {string} commandId - The command ID.
 * @returns {string} The cache key.
 */
export const RESPONSE_CACHE_KEY = (
  sessionId: string,
  commandId: string
): string => `cache:bot-session-response:${sessionId}:${commandId}`;

const RESPONSE_CACHE_INTERVAL_S = 60;

/**
 * Gets the AI response based on the session ID, command ID, prompt, and message.
 *
 * This function is used to get the response from the AI for a given session ID, command ID,
 * prompt, and message. It first checks if the response is already cached. If it is, it returns
 * the cached response. If not, it asks the AI for the response and caches it for a certain
 * amount of time before returning it.
 *
 * @param {string} sessionId - The session ID.
 * @param {string} commandId - The command ID.
 * @param {string} prompt - The prompt for the AI.
 * @param {string} message - The received message.
 * @returns {Promise<string | null>} The AI response or null if not available.
 */
async function getAiResponse(
  sessionId: string,
  commandId: string,
  prompt: string,
  message: string
): Promise<string | null> {
  /**
   * The system prompt for the AI.
   *
   * This prompt is used to tell the AI how to respond to the user. It tells the AI to
   * avoid responding to personal, philosophical, or religious questions, to respond in a
   * objective and educated manner, to use emojis whenever possible, and to respond only
   * in Portuguese.
   */
  const SYSTEM_PROMPT =
    "Você é um assistente de IA. Evite responder perguntas pessoais, filosóficas ou religiosas. Responda a perguntas de forma objetiva e educada. Use emojis sempre que possível. Responda apenas em Português Brasileiro. Siga as regras complementares as seguir:";

  // Check if the response is already cached
  const cachedResponse = await redis.get(
    RESPONSE_CACHE_KEY(sessionId, commandId)
  );
  if (cachedResponse) {
    // Return the cached response
    return cachedResponse;
  }

  // Ask the AI for the response
  const response = await askAI(`${SYSTEM_PROMPT} ${prompt}`, message);

  // Cache the response for a certain amount of time
  if (response) {
    await redis.set(
      RESPONSE_CACHE_KEY(sessionId, commandId),
      response,
      "EX",
      RESPONSE_CACHE_INTERVAL_S
    );
  }

  // Return the response
  return response;
}

/**
 * Kills a bot's WhatsApp client and removes its session.
 *
 * This function kills the WhatsApp client of a bot and removes its session from the
 * WhatsApp manager. It is used to stop a bot, for example, when the bot is marked as
 * inactive in the database.
 *
 * @param {string} sessionId - The session ID of the bot to kill.
 * @returns {Promise<void>} A promise that resolves when the bot is killed.
 */
async function killBot(sessionId: string): Promise<void> {
  try {
    // Kill the WhatsApp client
    await whatsappManager.killClient(sessionId);
  } catch (error) {
    logger.error(`Failed to kill bot ${sessionId}`, error);
  }
}

/**
 * Stops all bots and kills their WhatsApp clients.
 *
 * This function iterates over all WhatsApp client sessions managed by the
 * WhatsApp manager and kills each client. It then updates the bot state to
 * OFFLINE in the database.
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
 * Handles the bot process and sets up event listeners for process events.
 *
 * @description This function sets up event listeners for process events such as
 * exit, SIGTERM, SIGINT, and uncaughtException. When one of these events occurs,
 * the function calls the stopBots function to stop all bots and kill their
 * WhatsApp clients. Finally, it logs a message about the event and exits the
 * process.
 */
function handleBotProcess() {
  /**
   * Exit event
   *
   * @description Emitted when the process is about to exit.
   * @param {number} code - The exit code.
   */
  process.on("exit", async (code) => {
    await stopBots();
    logger.warn(`Process exit event with code ${code}`);
  });

  /**
   * SIGTERM event
   *
   * @description Emitted when the process receives a SIGTERM signal.
   * @param {string} signal - The signal received.
   */
  process.on("SIGTERM", async (signal) => {
    await stopBots();
    logger.warn(`Process ${process.pid} has been killed: ${signal}`);
    process.exit(0);
  });

  /**
   * SIGINT event
   *
   * @description Emitted when the process receives a SIGINT signal.
   * @param {string} signal - The signal received.
   */
  process.on("SIGINT", async (signal) => {
    await stopBots();
    logger.warn(`Process ${process.pid} has been interrupted: ${signal}`);
    process.exit(0);
  });

  /**
   * Uncaught exception event
   *
   * @description Emitted when an uncaught exception occurs.
   * @param {Error} error - The error that occurred.
   */
  process.on("uncaughtException", async (error) => {
    await stopBots();
    logger.error(`Uncaught exception: ${error}`);
    process.exit(1);
  });
}

/**
 * Main function to start offline bots and stream bot state changes.
 *
 * This function is called by Remix when the server starts. It starts the bot
 * state monitor and sets up process event listeners to handle process exit,
 * SIGTERM, SIGINT, and uncaughtException events.
 *
 * @returns {Promise<void>} A promise that resolves when the bot operations are complete.
 */
export const handleBot = async (): Promise<void> => {
  // Start the bot state monitor
  setInterval(monitorBotStates, 10000);

  // Set up process event listeners
  handleBotProcess();
};
