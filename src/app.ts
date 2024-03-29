import cookieParser from "cookie-parser";
import cors from "cors";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import express from "express";

import { env } from "./constants/env";
import { db } from "./db";
import errorHandler from "./middleware/error-handler";
import deserializeUser from "./middleware/deserialize-user";
import credentials from "./middleware/credentials";
import userRoute from "./modules/users/users.routes";
import { log } from "./utils/logger";
import { listenGracefulShutdown } from "./utils/listen-graceful-shutdown";
import { CORS_OPTIONS } from "./constants/cors-origins";

const main = async () => {
  const app = express();

  // Handle options credentials check - before CORS!
  // and fetch cookies credentials requirement
  app.use(credentials);

  // Cross Origin Resource Sharing
  app.use(cors(CORS_OPTIONS));

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
    return res.status(404).json({ error: "404: Route not found" });
  });

  app.use(errorHandler);

  const port = env.PORT;

  const server = app.listen(port, () => {
    log.info(` Server is running on port ${port}`);
  });

  try {
    await migrate(db, {
      migrationsFolder: "./migrations",
    });
    log.info("migrated successfully");
  } catch (error) {
    log.error("problem migrating...");
  }

  listenGracefulShutdown(server);
};

main();
