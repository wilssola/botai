import {useEffect, useState} from "react";
import {useEventSource} from "remix-utils/sse/react";
import {BOT_CHAT_SSE_PATH} from "~/routes";
import {BOT_CHAT_SSE_EVENT} from "~/routes/sse.bot-chat";

/**
 * DashboardChat component for displaying chat messages.
 *
 * @returns {JSX.Element} The DashboardChat component.
 */
export default function DashboardChat(): JSX.Element {
  // Parse the event source data from the server-sent events (SSE)
  const botChatSSE = JSON.parse(
    useEventSource(BOT_CHAT_SSE_PATH, {
      event: BOT_CHAT_SSE_EVENT,
    }) ?? "{}"
  );

  // State to store received WhatsApp messages
  const [whatsappReceive, setWhatsappReceive] = useState<string[]>([]);
  // State to store sent WhatsApp messages
  const [whatsappSend, setWhatsappSend] = useState<string[]>([]);

  // Effect to update the received and sent messages
  useEffect(() => {
    setWhatsappReceive((prev) => [...prev, ""]);
    setWhatsappSend((prev) => [...prev, ""]);
  }, []);

  return (
    <>
      <div>Em desenvolvimento</div>
    </>
  );
}
