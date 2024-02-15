import express from "express";

import { log } from "./utils/logger";

const main = async () => {
  const app = express();

  app.use(express.json());

  const port = 4000;

  const server = app.listen(port, () => {
    log.info(` Server is running on port ${port}`);
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
