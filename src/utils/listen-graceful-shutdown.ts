import { IncomingMessage, Server, ServerResponse } from "http";
import { log } from "./logger";

export const listenGracefulShutdown = (
  server: Server<typeof IncomingMessage, typeof ServerResponse>
) => {
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
