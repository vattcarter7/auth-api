import express from "express";

import validateSchema from "../../utils/validateSchema";
import {
  createUserSchema,
  verifyUserSchema,
  loginWithEmailAndPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./users.schemas";
import {
  createUserHandler,
  forgotPasswordHandler,
  loginWithEmailAndPasswordHandler,
  logoutHandler,
  refreshTokenHandler,
  resetPasswordHandler,
  verifyUserHandler,
} from "./users.controller";

const router = express.Router();

router.post(
  "/api/v1/users/login",
  validateSchema(loginWithEmailAndPasswordSchema),
  loginWithEmailAndPasswordHandler
);

router.post("/api/v1/users/logout", logoutHandler);

router.post(
  "/api/v1/users",
  validateSchema(createUserSchema),
  createUserHandler
);

router.post("/api/v1/users/refresh", refreshTokenHandler);

router.post(
  "/api/v1/users/verify/:id/:verificationCode",
  validateSchema(verifyUserSchema),
  verifyUserHandler
);

router.post(
  "/api/v1/users/forgot-password",
  validateSchema(forgotPasswordSchema),
  forgotPasswordHandler
);

router.post(
  "/api/v1/users/resetpassword/:id/:passwordResetCode",
  validateSchema(resetPasswordSchema),
  resetPasswordHandler
);

export default router;
