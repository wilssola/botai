import { FormStrategy } from "remix-auth-form";
import {
  createUserByCredentials,
  getUserByCredentials,
} from "~/models/user.server";
import { UserSession } from "../auth.server";

export const loginFormStrategy = new FormStrategy<UserSession>(
  async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const user = await getUserByCredentials({ email, password });
    return user;
  }
);

export const registerFormStrategy = new FormStrategy<UserSession>(
  async ({ form }) => {
    const username = form.get("username") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const user = await createUserByCredentials({ username, email, password });
    return user;
  }
);
