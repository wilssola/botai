import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";

export const WHATSAPP_QR_SSE_EVENT = "whatsapp-qr";

const WHATSAPP_QR_INTERVAL = 5 * 1000;
const WHATSAPP_QR_RESET_INTERVAL = 2 * WHATSAPP_QR_INTERVAL;

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
      for await (const _ of interval(WHATSAPP_QR_INTERVAL, {
        signal: request.signal,
      })) {
        time += WHATSAPP_QR_INTERVAL;
        if (time >= WHATSAPP_QR_RESET_INTERVAL) {
          botSession = await getBotSessionByUserId(user.id, request);
          time = 0;
        }

        if (!botSession) {
          return "";
        }

        send({
          event: WHATSAPP_QR_SSE_EVENT,
          data: botSession?.whatsappQr ?? "",
        });
      }
    }

    run();

    return async () => {};
  });
};
