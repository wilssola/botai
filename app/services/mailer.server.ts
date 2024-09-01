import nodemailer from "nodemailer";
import * as process from "node:process";

export const mailer = nodemailer.createTransport({
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
  const mail = await mailer.sendMail({
    from: `<${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log(`Mail sent: ${mail.messageId}`);
}