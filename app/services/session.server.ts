import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { APP_NAME } from "~/constants";
import { auth, UserSession } from "./auth.server";

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

export async function createUserSession(user: UserSession, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set(auth.sessionKey, user);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function destroyUserSession(request: Request) {
  const session = await getUserSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}
