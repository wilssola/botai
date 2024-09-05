import "./instrumentation";
import { createServer } from "http";
import { handleBot } from "~/bot.server";
import { app } from "./app";
import { logger } from "~/services/logger";
import { Server } from "socket.io";

export const APP_URL = process.env.APP_URL || "0.0.0.0";
export const PORT = process.env.PORT || 3000;
export const ADDRESS = `http://${APP_URL}:${PORT}`;

/**
 * Create HTTP server from Express app.
 */
export const server = createServer(app);

/**
 * Attach a WebSocket server to the HTTP server.
 *
 * This module sets up a WebSocket server using the socket.io library and
 * attaches it to the HTTP server. It handles incoming connections, emits
 * a confirmation event to the client, and listens for events and disconnections.
 */
export const socket = new Server(server);

/**
 * Handle incoming WebSocket connections.
 *
 * This event handler is called when a client establishes a WebSocket connection.
 * It logs a message to the console, emits a confirmation event to the client,
 * and sets up event listeners for incoming events and disconnections.
 */
function handleSocket() {
  socket.on("connection", async (socket) => {
    console.log(`WebSocket connection established with a Client: ${socket.id}`);

    /**
     * Emit a confirmation event to the client with the server's address.
     */
    socket.emit("confirmation", ADDRESS);

    /**
     * Handle incoming events from the client.
     *
     * This event handler is called when the client emits an event.
     */
    socket.on("event", (data) => {
      console.log(`Received event from Client (${socket.id}):`, data);

      socket.emit("event", "pong");
    });

    /**
     * Handle client disconnections.
     *
     * This event handler is called when the client disconnects from the server.
     */
    socket.on("disconnect", () => {
      console.log(`WebSocket connection closed with Client: ${socket.id}`);
    });
  });
}

/**
 * Main function to start the server and handle WebSocket connections.
 */
async function main() {
  try {
    handleSocket();

    server.listen(PORT, () => console.log(`Server listening at ${ADDRESS}`));

    await handleBot();
  } catch (error) {
    logger.fatal(`Server crashed`, error);
    process.exit(0);
  }
}

main();
