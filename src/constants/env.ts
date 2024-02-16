import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV!,
  PORT: parseInt(process.env.PORT!, 10),
  DATABASE_CONNECTION: process.env.DATABASE_CONNECTION!,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  MAIL_USER: process.env.MAIL_USER!,
  MAIL_PASS: process.env.MAIL_PASS!,
  MAIL_HOST: process.env.MAIL_HOST!,
  MAIL_PORT: process.env.MAIL_PORT!,
};
