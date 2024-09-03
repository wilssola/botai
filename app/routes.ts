/**
 * Home path constant.
 */
export const HOME_PATH = "/";

/**
 * Login path constant.
 */
export const LOGIN_PATH = "/login";

/**
 * Register path constant.
 */
export const REGISTER_PATH = "/register";

/**
 * Forgot password path constant.
 */
export const FORGOT_PASSWORD_PATH = "/forgot-password";

/**
 * Verify email path constant.
 */
export const VERIFY_EMAIL_PATH = "/verify-email";

/**
 * Products path constant.
 */
export const PRODUCTS_PATH = "/products";

/**
 * WhatsApp bots products path constant.
 */
export const PRODUCTS_PATH_WHATSAPP_BOT = `${PRODUCTS_PATH}/whatsapp-bot`;

/**
 * Features path constant.
 */
export const FEATURES_PATH = "/features";

/**
 * Pricing path constant.
 */
export const PRICING_PATH = "/pricing";

/**
 * Dashboard path constant.
 */
export const DASHBOARD_PATH = "/dashboard";

/**
 * Generates the WhatsApp QR socket path for a given session ID.
 * @param {string} sessionId - The session ID.
 * @returns {string} The WhatsApp QR socket path.
 */
export const WHATSAPP_QR_SOCKET_PATH = (sessionId: string): string =>
  `/socket/whatsapp-qr/${sessionId}`;

/**
 * WhatsApp QR SSE path constant.
 */
export const WHATSAPP_QR_SSE_PATH = "/sse/whatsapp-qr";
