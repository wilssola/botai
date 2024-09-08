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
 * @param {User} user - The user object.
 * @param {MailAuth | null} mailAuth - The mail authentication object.
 * @returns {Promise<MailAuth | null>} The updated mail authentication object.
 */
export async function sendMailAuthVerification(
  user: User,
  mailAuth: MailAuth | null
): Promise<MailAuth | null> {
  if (!emailSMTP) {
    logger.error("SMTP configuration is not set up");
    logger.warn("Ignoring mail authentication verification");
    return null;
  }

  if (!mailAuth) {
    mailAuth = await getUserMailAuthById(user.id);
  }

  if (
    mailAuth &&
    mailAuth.updatedAt.getTime() + MAX_EMAIL_CODE_TIME < Date.now()
  ) {
    mailAuth = await updateUserMailAuthCodeById(user.id);

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
 * Function to check if the user email verified.
 * @param {Request} request - The request object.
 * @returns {Promise<Response | void>} A redirect response if the user not authenticated or email not verified, otherwise void.
 */
export async function checkMailAuthVerified(
  request: Request
): Promise<Response | void> {
  if (!emailSMTP) {
    logger.error("SMTP configuration is not set up");
    logger.warn("Ignoring mail authentication verification");
    return;
  }

  const user = await getUserSession(request);
  if (!user) {
    throw redirect(LOGIN_PATH);
  }

  const mailAuth = await getUserMailAuthById(user.id);
  if (!mailAuth || !mailAuth.verified) {
    throw redirect(VERIFY_EMAIL_PATH);
  }
}

const emailSMTP =
  process.env.SMTP_HOST ||
  process.env.SMTP_PORT ||
  process.env.MAIL_USER ||
  process.env.MAIL_PASS;
