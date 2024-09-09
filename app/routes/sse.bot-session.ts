import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";
import { logger } from "~/logger";

export const BOT_SESSION_SSE_EVENT = "bot-session";

const SEND_INTERVAL = 2000;

/**
 * Loader function for the bot session SSE route.
 *
 * @param {LoaderFunctionArgs} context - The context object containing the request.
 * @param {Request} context.request - The request object.
 * @returns The event stream response.
 */
export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort());

  return eventStream(controller.signal, (send, abort) => {
    /**
     * Function to run the SSE stream.
     */
    async function run() {
      // Get the user session
      const user = await getUserSession(request);
      if (!user) {
        abort();
        return "";
      }

      // Send bot session data at regular intervals
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(SEND_INTERVAL, {
        signal: controller.signal,
      })) {
        const botSession = await getBotSessionByUserId(user.id, request);
        if (!botSession) {
          return "";
        }

        try {
          // Send the bot session data as an SSE event
          send({
            event: BOT_SESSION_SSE_EVENT,
            data: JSON.stringify(botSession),
          });
        } catch (error) {
          logger.error(`Cannot send bot session data: ${error}`);
        }
      }
    }

    // Run the SSE stream
    run().then(() => {
      logger.info("Bot session SSE stream completed");
    });

    // Cleanup function for the event stream
    return function clear() {
      controller.abort();
    };
  });
};
