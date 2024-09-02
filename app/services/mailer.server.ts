import nodemailer from "nodemailer";
import * as process from "node:process";

const mailer =
  process.env.NODE_ENV === "production"
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) == 465, // Use `true` for port 465, `false` for all other ports.
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      })
    : undefined;

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html: string
) {
  if (process.env.NODE_ENV != "production") {
    return;
  }

  try {
    const mail = await mailer!.sendMail({
      from: `<${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Mail sent: ${mail.messageId}`);
  } catch (error) {
    console.error(`Error sending mail: ${error}`);
  }
}
