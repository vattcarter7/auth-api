import express from "express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import cookieParser from "cookie-parser";
import path from "path";

import { log } from "./utils/logger";
import { db } from "./db";
import { env } from "./constants/env";
import userRoute from "./modules/users/users.routes";
import { errorHandler } from "./middleware/error-handler";

const main = async () => {
  const app = express();

  // built-in middleware to handle urlencoded form data
  app.use(express.urlencoded({ extended: false }));

  // built-in middleware for json
  app.use(express.json());

  //middleware for cookies
  app.use(cookieParser());

  app.get("/health-check", (_, res) => res.sendStatus(200));

  app.use(userRoute);

  app.all("*", (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
      res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
      res.json({ error: "404 Not Found" });
    } else {
      res.type("txt").send("404 Not Found");
    }
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
