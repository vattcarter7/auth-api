import nodemailer, { SendMailOptions } from "nodemailer";

import { log } from "./logger";
import { env } from "../constants/env";

const smtp = {
  user: env.MAIL_USER,
  pass: env.MAIL_PASS,
  host: env.MAIL_HOST,
  port: parseInt(env.MAIL_PORT, 10),
  secure: true,
};

const transporter = nodemailer.createTransport({
  ...smtp,
  auth: { user: smtp.user, pass: smtp.pass },
});

export const sendEmail = async (payload: SendMailOptions) => {
  transporter.sendMail(payload, (err, info) => {
    if (err) {
      log.error(err, "Error sending email");
      return;
    }
  });
};

export default sendEmail;
