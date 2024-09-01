import {FormStrategy} from "remix-auth-form";
import {createUserByForm, getUserByForm} from "~/models/user.server";
import {UserSession} from "../auth.server";

export const loginFormStrategy = new FormStrategy<UserSession>(
  async ({ form }) => {
    const email = form.get("email") as string;
    const password = form.get("password") as string;
  
    return await getUserByForm({email, password});
  }
);

export const registerFormStrategy = new FormStrategy<UserSession>(
  async ({ form }) => {
    const username = form.get("username") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
  
    return await createUserByForm({username, email, password});
  }
);
