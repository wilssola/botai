import { LoaderFunction } from "@remix-run/node";
import { useEffect } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { useSocket } from "~/context";
import { LOGIN_PATH, WHATSAPP_QR_SSE_PATH } from "~/routes";
import { envLoader } from "~/utils/env-loader.server";
import sessionLoader from "~/utils/session-loader.server";
import { WHATSAPP_QR_SSE_EVENT } from "~/routes/sse.whatsapp-qr";
import { QRCode } from "react-qrcode-logo";

export const loader: LoaderFunction = async ({ request }) => {
  await sessionLoader(request, { failureRedirect: LOGIN_PATH });
  return await envLoader();
};

export default function Dashboard() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("event", (data) => {
      console.log(`Received event from Server (${socket.id}):`, data);
    });
  }, [socket]);

  const whatsappQr = useEventSource(WHATSAPP_QR_SSE_PATH, {
    event: WHATSAPP_QR_SSE_EVENT,
  });

  return (
    <>
      <QRCode
        value={whatsappQr ?? ""}
        logoImage="/whatsapp.png"
        removeQrCodeBehindLogo={true}
      ></QRCode>
    </>
  );
}
