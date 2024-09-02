import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";

export const WHATSAPP_QR_SSE_EVENT = "whatsapp-qr";

const WHATSAPP_QR_RESET_INTERVAL = 20 * 1000;

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    async function run() {
      const user = await getUserSession(request);
      if (!user) {
        return "";
      }

      const session = await getBotSessionByUserId(user.id, request);
      if (!session) {
        return "";
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(WHATSAPP_QR_RESET_INTERVAL, {
        signal: request.signal,
      })) {
        send({
          event: WHATSAPP_QR_SSE_EVENT,
          data: session?.whatsappQr ?? "",
        });
      }
    }

    run();

    return async () => {
      // This will be called when the client closes the connection or when the request is aborted.
      // You can use it to clean up any resources or subscriptions that you might have created.
    };
  });
};
