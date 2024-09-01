import { auth } from "~/services/auth.server";

export default async function sessionLoader(
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
