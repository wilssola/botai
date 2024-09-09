import {auth} from "~/services/auth.server";
import {logger} from "~/logger";

/**
 * Loads the session and handles redirection based on authentication status.
 *
 * @param {Request} request - The request object.
 * @param {Object} options - Options for redirection.
 * @param {string} [options.successRedirect] - URL to redirect to on successful authentication.
 * @param {string} [options.failureRedirect] - URL to redirect to on failed authentication.
 * @returns {Promise<void>} A promise that resolves when the session is loaded and redirection is handled.
 */
export default async function sessionLoader(
  request: Request,
  options: {
    successRedirect?: string;
    failureRedirect?: string;
  }
): Promise<void> {
  logger.info("Checking session");

  // Check if the user is authenticated and handle redirection
  await auth.isAuthenticated(request, {
    successRedirect: options.successRedirect ?? "",
    failureRedirect: options.failureRedirect ?? "",
  });
}
