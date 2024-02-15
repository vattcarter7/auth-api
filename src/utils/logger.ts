import dayjs from "dayjs";
import pino from "pino";

export const log = pino({
  redact: ["DATABASE_CONNECTION", "JWT_SECRET", "JWT_EXPIRES"],
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true
    }
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
});
