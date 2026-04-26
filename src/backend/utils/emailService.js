import nodemailer from "nodemailer";
import config from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.auth,
});

export const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
  console.log(`Email sent: ${info.messageId}`);
  return info;
};
