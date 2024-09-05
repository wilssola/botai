import {Server} from "socket.io";
import {ADDRESS, server} from "./server";

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
export const handleSocket = () =>
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
