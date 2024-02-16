import express from "express";

import validateSchema from "../../utils/validateSchema";
import { createUserSchema, verifyUserSchema } from "./users.schemas";
import { createUserHandler, verifyUserHandler } from "./users.controller";

const router = express.Router();

router.post(
  "/api/v1/users",
  validateSchema(createUserSchema),
  createUserHandler
);

router.post(
  "/api/v1/users/verify/:id/:verificationCode",
  validateSchema(verifyUserSchema),
  verifyUserHandler
);

export default router;
