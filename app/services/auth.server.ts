import { User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { AuthStrategies } from "./auth";
import { loginFormStrategy, registerFormStrategy } from "./auth/form.strategy";
import { sessionStorage } from "./session.server";

export type UserSession = Omit<User, "password"> | null;

export const auth = new Authenticator<UserSession>(sessionStorage);

auth.use(loginFormStrategy, AuthStrategies.FORM_LOGIN);
auth.use(registerFormStrategy, AuthStrategies.FORM_REGISTER);

export async function getUserSession(req: Request) {
  return await auth.isAuthenticated(req);
}
