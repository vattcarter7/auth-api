import cookieParser from "cookie-parser";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import express from "express";

import { env } from "./constants/env";
import { db } from "./db";
import { errorHandler } from "./middleware/error-handler";
import deserializeUser from "./middleware/deserialize-user";
import userRoute from "./modules/users/users.routes";
import { log } from "./utils/logger";

const main = async () => {
  const app = express();

  // built-in middleware to handle urlencoded form data
  app.use(express.urlencoded({ extended: false }));

  // built-in middleware for json
  app.use(express.json());

  app.use(deserializeUser);

  //middleware for cookies
  app.use(cookieParser());

  app.get("/health-check", (_, res) => res.sendStatus(200));

  app.use(userRoute);

  app.all("*", (_, res) => {
    return res.status(404).json({ error: "404: Route Not Found" });
  });

  app.use(errorHandler);

  const port = env.PORT;

  const server = app.listen(port, () => {
    log.info(` Server is running on port ${port}`);
  });

  await migrate(db, {
    migrationsFolder: "./migrations",
  });

  const signals = [
    "SIGTERM",
    "SIGINT",
    "uncaughtException",
    "unhandledRejection",
  ];

  // Graceful shutdown
  for (const signal of signals) {
    process.on(signal, () => {
      log.info(`${signal} signal received: closing HTTP server`);
      server.close(() => {
        log.info("HTTP server closed");
      });
    });
  }
};

main();
