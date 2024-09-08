import nodemailer from "nodemailer";
import * as process from "node:process";
import { logger } from "~/logger";

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) == 465, // Use `true` for port 465, `false` for all other ports.
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html: string
) {
  try {
    const mail = await mailer!.sendMail({
      from: `<${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Mail sent: ${mail.messageId}`);
  } catch (error) {
    logger.error(`Error sending mail: ${error}`);
  }
}
