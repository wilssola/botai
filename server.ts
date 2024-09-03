import "./instrumentation.server";
import { createServer } from "http";
import { Server } from "socket.io";
import { bot } from "~/bot.server";
import { app, PORT } from "./app";

const appUrl = process.env.APP_URL || "0.0.0.0";
const port = process.env.PORT || PORT;
const host = `http://${appUrl}:${port}`;

/**
 * Create HTTP server from Express app.
 */
const server = createServer(app);

/**
 * Attach socket.io server to the HTTP server.
 */
const io = new Server(server);

/**
 * Main function to start the server and handle WebSocket connections.
 */
async function main() {
  try {
    io.on("connection", async (socket) => {
      console.log(
        `WebSocket connection established with a Client: ${socket.id}`
      );

      socket.emit("confirmation", host);

      socket.on("event", (data) => {
        console.log(`Received event from Client (${socket.id}):`, data);

        socket.emit("event", "pong");
      });

      socket.on("disconnect", () => {
        console.log(`WebSocket connection closed with Client: ${socket.id}`);
      });

      await bot(socket);
    });

    server.listen(port, () => console.log(`Server listening at ${host}`));
  } catch (error) {
    console.error(`Server crashed`);
    throw error;
  }
}

main();
