import express from "express";

import validateSchema from "../../utils/validateSchema";
import { createUserSchema } from "./users.schemas";
import { createUserHandler } from "./users.controller";

const router = express.Router();

router.post(
  "/api/v1/users",
  validateSchema(createUserSchema),
  createUserHandler
);

export default router;