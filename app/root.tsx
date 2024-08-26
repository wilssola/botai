import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import "./tailwind.css";

export function Layout({ children }: { children: React.ReactNode }) {
  // https://github.com/remix-run/remix/issues/3192
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

export default function App() {
  return <Outlet />;
}
