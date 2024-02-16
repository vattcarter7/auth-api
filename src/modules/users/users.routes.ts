import express from "express";

import validateSchema from "../../utils/validateSchema";
import { createUserSchema, verifyUserSchema, loginWithEmailAndPasswordSchema } from "./users.schemas";
import { createUserHandler, loginWithEmailAndPasswordHandler, verifyUserHandler } from "./users.controller";

const router = express.Router();

router.post(
  "/api/v1/users/login",
  validateSchema(loginWithEmailAndPasswordSchema),
  loginWithEmailAndPasswordHandler
);

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
