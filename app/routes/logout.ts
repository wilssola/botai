import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import sessionLoader from "~/utils/session-loader.server";
import { LOGIN_PATH } from "~/routes";
import { auth } from "~/services/auth.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await sessionLoader(request, {
    failureRedirect: LOGIN_PATH,
  });

  await auth.logout(request, { redirectTo: LOGIN_PATH });
};
