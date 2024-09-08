import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";
import { logger } from "~/logger";

export const BOT_SESSION_SSE_EVENT = "bot-session";

const SEND_INTERVAL = 1000;

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    async function run() {
      const user = await getUserSession(request);
      if (!user) {
        return "";
      }

      let botSession = await getBotSessionByUserId(user.id, request);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(SEND_INTERVAL, {
        signal: request.signal,
      })) {
        botSession = await getBotSessionByUserId(user.id, request);

        if (!botSession) {
          return "";
        }

        send({
          event: BOT_SESSION_SSE_EVENT,
          data: JSON.stringify(botSession),
        });
      }
    }

    run().then(() => logger.info("Bot session SSE stream ended"));

    return async () => {};
  });
};
