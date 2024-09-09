import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";
import { logger } from "~/logger";

export const BOT_SESSION_SSE_EVENT = "bot-session";

const SEND_INTERVAL = 1000;

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  const controller = new AbortController();
  const abortListener = () => controller.abort();
  request.signal.addEventListener("abort", abortListener);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return eventStream(controller.signal, (send) => {
    const timer = setInterval(async () => {
      const user = await getUserSession(request);
      if (!user) {
        send({
          event: BOT_SESSION_SSE_EVENT,
          data: "",
        });
        return;
      }

      const botSession = await getBotSessionByUserId(user.id, request);
      if (!botSession) {
        send({
          event: BOT_SESSION_SSE_EVENT,
          data: "",
        });
        return;
      }

      try {
        send({
          event: BOT_SESSION_SSE_EVENT,
          data: JSON.stringify(botSession),
        });
      } catch (error) {
        logger.error(`Cannot send bot session data: ${error}`);
      }
    }, SEND_INTERVAL);

    return () => {
      clearInterval(timer);
      request.signal.removeEventListener("abort", abortListener);
      controller.abort();
    };
  });
};
