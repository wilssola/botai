import "./instrumentation";
import { createServer } from "http";
import { bot } from "~/bot.server";
import { app } from "./app";
import { logger } from "~/services/logger";

export const APP_URL = process.env.APP_URL || "0.0.0.0";
export const PORT = process.env.PORT || 3000;
export const ADDRESS = `http://${APP_URL}:${PORT}`;

/**
 * Create HTTP server from Express app.
 */
export const server = createServer(app);

/**
 * Main function to start the server and handle WebSocket connections.
 */
async function main() {
  try {
    server.listen(PORT, () => console.log(`Server listening at ${ADDRESS}`));

    await bot();
  } catch (error) {
    logger.fatal(`Server crashed`, error);
  }
}

main();
