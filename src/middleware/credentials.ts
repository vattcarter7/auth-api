import { NextFunction, Request, Response } from "express";
import { ALLOWED_ORIGINS } from "../constants/cors-origins";

const credentials = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", JSON.parse("true"));
  }
  next();
};

export default credentials;
