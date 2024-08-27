import { createCookieSessionStorage } from "@remix-run/node";
import { APP_NAME } from "~/constants";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: `${APP_NAME.toLowerCase().trim().replace(" ", "-")}-session`,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
