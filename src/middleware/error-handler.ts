import { Request, NextFunction, Response } from "express";
import { log } from "../utils/logger";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  log.error(err?.stack);
  res.status(500).send(err.message);
};

export default errorHandler;
