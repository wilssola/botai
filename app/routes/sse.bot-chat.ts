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

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    async function run() {
      const user = await getUserSession(request);
      if (!user) {
        return "";
      }

      let botSession = await getBotSessionByUserId(user.id, request);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(SEND_INTERVAL_MS, {
        signal: request.signal,
      })) {
        if (!botSession) {
          return "";
        }

        const messages = await redis.get(MESSAGES_CACHE_KEY(botSession.id));
        if (!messages) {
          return "";
        }

        send({
          event: BOT_CHAT_SSE_EVENT,
          data: messages,
        });
      }
    }

    run().then(() => logger.info("Bot chat SSE stream ended"));

    return async () => {};
  });
};
