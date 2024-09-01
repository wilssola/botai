import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { interval } from "remix-utils/timers";
import { getUserSession } from "~/services/auth.server";
import { getBotSessionByUserId } from "~/models/bot.server";
import { v4 as uuidv4 } from "uuid";

export const WHATSAPP_QR_SSE_EVENT = "whatsapp-qr";

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return eventStream(request.signal, function setup(send) {
    async function run() {
      const user = await getUserSession(request);
      if (!user) {
        return uuidv4();
      }

      const session = await getBotSessionByUserId(user.id, request);
      if (!session) {
        return uuidv4();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of interval(1500, { signal: request.signal })) {
        send({
          event: WHATSAPP_QR_SSE_EVENT,
          data: session?.whatsappQr ?? uuidv4(),
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
