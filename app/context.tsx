import type {ReactNode} from "react";
import {createContext, useContext} from "react";
import type {Socket} from "socket.io-client";

/**
 * \[ProviderProps\] defines the properties for the \[SocketProvider\] component.
 *
 * @property {Socket | undefined} socket - The socket instance to provide.
 * @property {ReactNode} children - The children components that will have access to the socket instance.
 */
type ProviderProps = {
  socket: Socket | undefined;
  children: ReactNode;
};

/**
 * \[context\] is a React context to hold the socket instance.
 */
const context = createContext<Socket | undefined>(undefined);

/**
 * Custom hook to use the Socket context.
 *
 * @returns The current socket instance or undefined if not available.
 */
export function useSocket() {
  return useContext(context);
}

/**
 * SocketProvider component to provide the socket instance to its children.
 *
 * @param {ProviderProps} props - The props for the SocketProvider component.
 * @param {Socket | undefined} props.socket - The socket instance to provide.
 * @param {ReactNode} props.children - The children components that will have access to the socket instance.
 * @returns The rendered SocketProvider component.
 */
export function SocketProvider({ socket, children }: ProviderProps) {
  return <context.Provider value={socket}>{children}</context.Provider>;
}
