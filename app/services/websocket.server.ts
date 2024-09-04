import {Server} from "socket.io";
import {ADDRESS, server} from "../../server";

/**
 * Attach socket.websocket server to the HTTP server.
 */
export const websocket = new Server(server);

websocket.on("connection", async (socket) => {
  console.log(`WebSocket connection established with a Client: ${socket.id}`);

  socket.emit("confirmation", ADDRESS);

  socket.on("event", (data) => {
    console.log(`Received event from Client (${socket.id}):`, data);

    socket.emit("event", "pong");
  });

  socket.on("disconnect", () => {
    console.log(`WebSocket connection closed with Client: ${socket.id}`);
  });
});
