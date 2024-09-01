import { auth } from "~/services/auth.server";

export default async function sessionLoaderServer(
  request: Request,
  options: {
    successRedirect?: string;
    failureRedirect?: string;
  }
) {
  await auth.isAuthenticated(request, {
    successRedirect: options.successRedirect ?? "",
    failureRedirect: options.failureRedirect ?? "",
  });
}
