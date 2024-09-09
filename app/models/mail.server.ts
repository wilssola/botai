import {MailAuth, User} from "@prisma/client";
import {getUserMailAuthById, updateUserMailAuthCodeById,} from "~/models/user.server";
import {APP_NAME, MAX_EMAIL_CODE_TIME} from "~/constants";
import {sendMail} from "~/services/mailer.server";
import {redirect} from "@remix-run/node";
import {getUserSession} from "~/services/auth.server";
import {LOGIN_PATH, VERIFY_EMAIL_PATH} from "~/routes";
import {logger} from "~/logger";

/**
 * Sends a mail authentication verification email to the user.
 *
 * @param {User} user - The user object.
 * @param {MailAuth | null} [mailAuth] - The mail authentication object (optional).
 * @returns {Promise<MailAuth | null>} The updated mail authentication object.
 */
export async function sendMailAuthVerification(
  user: User,
  mailAuth?: MailAuth | null
): Promise<MailAuth | null> {
  // Check if SMTP configuration is set up
  if (!SMTP_SETUP) {
    logger.error("SMTP configuration is not set up");
    logger.warn("Ignoring mail authentication verification");
    return null;
  }

  // Retrieve mail authentication object if not provided
  if (!mailAuth) {
    mailAuth = await getUserMailAuthById(user.id);
  }

  // Check if the mail authentication code has expired
  if (
    mailAuth &&
    mailAuth.updatedAt.getTime() + MAX_EMAIL_CODE_TIME < Date.now()
  ) {
    // Update the mail authentication code
    mailAuth = await updateUserMailAuthCodeById(user.id);

    // Send the verification email
    await sendMail(
      user.email,
      `${APP_NAME} | Código de verificação`,
      `Seu código de verificação é: ${mailAuth!.code}`,
      `Seu código de verificação é: <strong>${mailAuth!.code}</strong>`
    );
  }

  return mailAuth;
}

/**
 * Function to check if the user's email is verified.
 *
 * @param {Request} request - The request object.
 * @returns {Promise<Response | void>} A redirect response if the user is not authenticated or email is not verified, otherwise void.
 */
export async function checkMailAuthVerified(
  request: Request
): Promise<Response | void> {
  // Check if SMTP configuration is set up
  if (!SMTP_SETUP) {
    logger.error("SMTP configuration is not set up");
    logger.warn("Ignoring mail authentication verification");
    return;
  }

  // Retrieve the user session
  const user = await getUserSession(request);
  if (!user) {
    logger.warn("User is not authenticated");
    logger.warn("Redirecting to login page");
    throw redirect(LOGIN_PATH);
  }

  // Retrieve the mail authentication object
  const mailAuth = await getUserMailAuthById(user.id);
  if (!mailAuth || !mailAuth.verified) {
    logger.warn("User email is not verified");
    logger.warn("Redirecting to email verification page");
    throw redirect(VERIFY_EMAIL_PATH);
  }
}

// SMTP configuration from environment variables
const SMTP_SETUP =
  process.env.NODE_ENV === "production" &&
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.MAIL_USER &&
  process.env.MAIL_PASS;
