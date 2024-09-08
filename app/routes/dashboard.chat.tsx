import { useEffect, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { BOT_CHAT_SSE_PATH } from "~/routes";
import { BOT_CHAT_SSE_EVENT } from "~/routes/sse.bot-chat";

export default function DashboardChat() {
  const botChatSSE = JSON.parse(
    useEventSource(BOT_CHAT_SSE_PATH, {
      event: BOT_CHAT_SSE_EVENT,
    }) ?? "{}"
  );

  const [whatsappReceive, setWhatsappReceive] = useState<string[]>([]);
  const [whatsappSend, setWhatsappSend] = useState<string[]>([]);

  useEffect(() => {
    setWhatsappReceive((prev) => [...prev, ""]);
    setWhatsappSend((prev) => [...prev, ""]);
  });

  return (
    <>
      <div>Em desenvolvimento</div>
    </>
  );
}
