import {LoaderFunction, LoaderFunctionArgs} from "@remix-run/node";
import sessionLoader from "~/utils/session-loader.server";
import {LOGIN_PATH} from "~/routes";
import {auth} from "~/services/auth.server";

/**
 * Loader function for the logout route.
 *
 * @param {LoaderFunctionArgs} context - The context object containing the request.
 * @param {Request} context.request - The request object.
 * @returnsA promise that resolves when the user is logged out.
 */
export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  // Load the session and redirect to the login page if the session is invalid
  await sessionLoader(request, {
    failureRedirect: LOGIN_PATH,
  });

  // Log out the user and redirect to the login page
  await auth.logout(request, { redirectTo: LOGIN_PATH });
};
