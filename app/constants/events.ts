/**
 * Generates the WhatsApp QR socket path for a given session ID.
 * @param {string} sessionId - The session ID.
 * @returns {string} The WhatsApp QR socket path.
 */
export const WHATSAPP_QR_SOCKET_EVENT = (sessionId: string): string =>
  `/socket/whatsapp-qr/${sessionId}`;

export const WHATSAPP_CHAT_RECEIVE_SOCKET_EVENT = (sessionId: string): string =>
  `/chat/receive/${sessionId}`;

export const WHATSAPP_CHAT_SEND_SOCKET_EVENT = (sessionId: string): string =>
  `/chat/send/${sessionId}`;
