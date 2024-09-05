import {LoaderFunction, LoaderFunctionArgs} from "@remix-run/node";
import React, {useEffect, useState} from "react";
import {useEventSource} from "remix-utils/sse/react";
import {useSocket} from "~/context";
import {LOGIN_PATH, WHATSAPP_QR_SSE_PATH} from "~/routes";
import {envLoader} from "~/utils/env-loader.server";
import {WHATSAPP_QR_SSE_EVENT} from "~/routes/sse.whatsapp-qr";
import {getUserSession} from "~/services/auth.server";
import {checkMailAuthVerified} from "~/models/mail.server";
import {useLoaderData} from "@remix-run/react";
import Header from "~/components/dashboard/Header";
import {createBotSessionByUserId, getBotSessionByUserId,} from "~/models/bot.server";
import sessionLoader from "~/utils/session-loader.server";
import TokenInput from "~/components/inputs/TokenInput";
import {QRCodeSVG} from "qrcode.react";
import {FaWhatsapp} from "react-icons/fa";
import {BotSession} from "@prisma/client";

/**
 * Loader function to handle the initial data fetching for the dashboard page.
 * @param {LoaderFunctionArgs} args - The request object.
 * @param {Request} args.request - The request object.
 * @returns {Promise<object>} The environment variables.
 */
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs): Promise<object> => {
  await sessionLoader(request, { failureRedirect: LOGIN_PATH });

  await checkMailAuthVerified(request);

  const env = await envLoader();
  const user = await getUserSession(request);

  let botSession = await getBotSessionByUserId(user!.id);
  if (!botSession || !botSession.state) {
    botSession = await createBotSessionByUserId(user!.id);
  }

  return { env, user, botSession };
};

/**
 * Component to render the dashboard page.
 * @returns {React.ReactElement} The dashboard page component.
 */
export default function Dashboard(): React.ReactElement {
  const socket = useSocket();
  const loaderData = useLoaderData<typeof loader>();

  const whatsappQr = useEventSource(WHATSAPP_QR_SSE_PATH, {
    event: WHATSAPP_QR_SSE_EVENT,
  });

  const [whatsappReceive, setWhatsappReceive] = useState<string[]>([]);
  const [whatsappSend, setWhatsappSend] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("event", (data) => {
      console.log(`Received event from Server (${socket.id}):`, data);
    });
  }, [socket]);

  useEffect(() => {
    setWhatsappReceive((prev) => [...prev, ""]);
    setWhatsappSend((prev) => [...prev, ""]);
  }, [loaderData.botSession.sessionId]);

  return (
    <>
      <Header user={loaderData.user} />

      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid-cols-1 grid gap-2 items-center justify-center max-w-64 bg-emerald-600 p-3 rounded-md shadow-lg">
            <div className="flex items-center justify-center space-x-5">
              <div className="p-2 bg-white rounded-md shadow-md">
                <QRCodeSVG
                  value={
                    whatsappQr ??
                    (loaderData.botSession as BotSession).whatsappQr ??
                    ""
                  }
                  title="WhatsApp QRCode"
                ></QRCodeSVG>
              </div>
              <FaWhatsapp className="text-white" size={64} />
            </div>

            <TokenInput
              buttonClassName="bg-gray-700"
              value={
                whatsappQr ??
                (loaderData.botSession as BotSession).whatsappQr ??
                ""
              }
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Mensagens Recebidas
            </h2>
            <div className="space-y-2">
              {whatsappReceive.map((message, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-md">
                  {message}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">
              Mensagens Enviadas
            </h2>
            <div className="space-y-2">
              {whatsappSend.map((message, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-md">
                  {message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
