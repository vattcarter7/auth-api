import express from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { log } from "./utils/logger";
import { db } from "./db";
import { env } from "./constants/env";
import userRoute from "./modules/users/users.routes";

const main = async () => {
  const app = express();

  app.use(express.json());

  app.get("/health-check", (_, res) => res.sendStatus(200));

  app.use(userRoute);

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
