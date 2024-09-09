import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";

export const BOT_SESSION_SSE_EVENT = "bot-session";

const SEND_INTERVAL = 1000;

/**
 * Loader function for the bot session SSE route.
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

      // Send bot session data at regular intervals
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(SEND_INTERVAL, {
        signal: request.signal,
      })) {
        const botSession = await getBotSessionByUserId(user.id, request);
        if (!botSession) {
          return "";
        }

        // Send the bot session data as an SSE event
        send({
          event: BOT_SESSION_SSE_EVENT,
          data: JSON.stringify(botSession),
        });
      }
    }

    // Run the SSE stream and log when it ends
    run();

    // Cleanup function for the event stream
    return async () => {};
  });
};
