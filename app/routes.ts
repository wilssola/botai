export const HOME_PATH = "/";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const FORGOT_PASSWORD_PATH = "/forgot-password";

export const PRODUCTS_PATH = "/products";
export const PRODUCTS_PATH_WHATSAPP_BOT = `${PRODUCTS_PATH}/whatsapp-bot`;
export const FEATURES_PATH = "/features";
export const PRICING_PATH = "/pricing";

export const DASHBOARD_PATH = "/dashboard";

export const WHATSAPP_QR_SOCKET_PATH = (sessionId: string) =>
  `/socket/whatsapp-qr/${sessionId}`;
export const WHATSAPP_QR_SSE_PATH = "/sse/whatsapp-qr";
