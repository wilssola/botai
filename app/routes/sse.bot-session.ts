import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";

export const BOT_SESSION_SSE_EVENT = "bot-session";

const SEND_INTERVAL = 5 * 1000;
const RESET_INTERVAL = 2 * SEND_INTERVAL;

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    async function run() {
      const user = await getUserSession(request);
      if (!user) {
        return "";
      }

      let time = 0;
      let botSession = await getBotSessionByUserId(user.id, request);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(SEND_INTERVAL, {
        signal: request.signal,
      })) {
        time += SEND_INTERVAL;
        if (time >= RESET_INTERVAL) {
          botSession = await getBotSessionByUserId(user.id, request);
          time = 0;
        }

        if (!botSession) {
          return "";
        }

        send({
          event: BOT_SESSION_SSE_EVENT,
          data: JSON.stringify(botSession),
        });
      }
    }

    run();

    return async () => {};
  });
};
