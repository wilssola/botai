import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";
import { logger } from "~/logger";
import { redis } from "~/services/redis.server";
import { MESSAGES_CACHE_KEY } from "~/bot.server";

export const BOT_CHAT_SSE_EVENT = "bot-chat";

const SEND_INTERVAL_MS = 2 * 1000;

/**
 * Loader function for the bot chat SSE route.
 *
 * @param {LoaderFunctionArgs} context - The context object containing the request.
 * @param {Request} context.request - The request object.
 * @returns The event stream response.
 */
export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    /**
     * Function to run the SSE stream.
     */
    async function run() {
      // Get the user session
      const user = await getUserSession(request);
      if (!user) {
        return "";
      }

      // Get the bot session for the user
      let botSession = await getBotSessionByUserId(user.id, request);

      // Send messages at regular intervals
      for await (const _ of interval(SEND_INTERVAL_MS, {
        signal: request.signal,
      })) {
        if (!botSession) {
          return "";
        }

        // Get messages from Redis cache
        const messages = await redis.get(MESSAGES_CACHE_KEY(botSession.id));
        if (!messages) {
          return "";
        }

        // Send the messages as an SSE event
        send({
          event: BOT_CHAT_SSE_EVENT,
          data: messages,
        });
      }
    }

    // Run the SSE stream and log when it ends
    run().then(() => logger.info("Bot chat SSE stream ended"));

    // Cleanup function for the event stream
    return async () => {};
  });
};
