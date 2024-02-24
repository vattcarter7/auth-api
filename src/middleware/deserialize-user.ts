import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_PAYLOAD } from "../constants/types";
import { env } from "../constants/env";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = (req.headers.authorization || "").replace(
    /^Bearer\s/,
    ""
  );

  if (!accessToken) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET
    ) as JWT_PAYLOAD;
  
    if (decoded.userId) {
      res.locals.user = decoded;
    }
  } catch (error) {
    console.log("error verify token");
  }

  return next();
};

export default deserializeUser;
