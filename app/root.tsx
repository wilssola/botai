import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { SocketProvider } from "./context";
import "./tailwind.css";

export { envLoader as loader } from "~/utils/env-loader.server";

/**
 * Layout component that wraps the application content.
 *
 * @param {{ children: React.ReactNode }} props - The props for the Layout component.
 * @returns {JSX.Element} The rendered Layout component.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  /**
   * @see https://github.com/remix-run/remix/issues/3192
   */
  const [jsEnabled, setJsEnabled] = useState(false);

  useEffect(() => setJsEnabled(true), []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={jsEnabled ? "js-enabled" : ""}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Main application component.
 *
 * @returns {JSX.Element} The rendered App component.
 */
export default function App() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();

    setSocket(socket);

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("confirmation", (data) => {
      console.log(`WebSocket connection established with the Server: ${data}`);

      socket.emit("event", "ping");
    });

    socket.on("event", (data) => {
      console.log(`Received event from Server (${socket.id}):`, data);
    });

    socket.on("disconnect", () => {
      console.log(`WebSocket connection closed with the Server: ${socket.id}`);
    });
  }, [socket]);

  return (
    <SocketProvider socket={socket}>
      <Outlet />
    </SocketProvider>
  );
}
