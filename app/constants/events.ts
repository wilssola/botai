/**
 * Generates the WhatsApp QR socket path for a given session ID.
 * @param {string} sessionId - The session ID.
 * @returns {string} The WhatsApp QR socket path.
 */
export const WHATSAPP_QR_SOCKET_EVENT = (sessionId: string): string =>
  `/socket/whatsapp-qr/${sessionId}`;

/**
 * Generates the WhatsApp chat receive socket path for a given session ID.
 * @param {string} sessionId - The session ID.
 * @returns {string} The WhatsApp chat receive socket path.
 */
export const WHATSAPP_CHAT_RECEIVE_SOCKET_EVENT = (sessionId: string): string =>
  `/chat/receive/${sessionId}`;

/**
 * Generates the WhatsApp chat send socket path for a given session ID.
 * @param {string} sessionId - The session ID.
 * @returns {string} The WhatsApp chat send socket path.
 */
export const WHATSAPP_CHAT_SEND_SOCKET_EVENT = (sessionId: string): string =>
  `/chat/send/${sessionId}`;
