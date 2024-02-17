import { Request, Response } from "express";
import { nanoid } from "nanoid";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import {
  CreateUserInput,
  LoginWithEmailAndPasswordInput,
  VerifyUserInput,
} from "./users.schemas";
import sendEmail from "../../utils/mailer";
import {
  createUser,
  createUserSessionToken,
  deleteSessionToken,
  deleteUserSessions,
  findSessionToken,
  findUserByEmail,
  findUserById,
  verifyUserById,
} from "./users.services";
import { env } from "../../constants/env";

// userId: user.id,
// email: email,
// firstName: user.firstName,
// lastName: user.lastName,
// verified: user.verified,

type JWT_PAYLOAD = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  verified: boolean;
}

export const loginWithEmailAndPasswordHandler = async (
  req: Request<{}, {}, LoginWithEmailAndPasswordInput>,
  res: Response
) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    return res.send("Invalid email or password");
  }

  if (!user.verified) {
    return res.send("Please verify your email");
  }

  const isPasswordValid = await argon2.verify(user.password, password);

  if (!isPasswordValid) {
    return res.send("Invalid email or password");
  }
  // Sign access token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: email,
      firstName: user.firstName,
      lastName: user.lastName,
      verified: user.verified,
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10s",
    }
  );

  const refreshToken = jwt.sign({ userId: user.id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  await createUserSessionToken({ userId: user.id, sessionToken: refreshToken });

  // Creates Secure Cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({ accessToken, refreshToken });
};

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response
) {
  const { email, firstName, lastName, password } = req.body;
  const hashedPassword = await argon2.hash(password);
  const verificationCode = nanoid();
  try {
    const user = await createUser({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      verificationCode,
    });

    await sendEmail({
      to: user.email,
      from: "test@example.com",
      subject: "Verify your email",
      text: `verification code: ${user.verificationCode} - Id: ${user.id}`,
    });

    return res.send("User successfully created");
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(409).send("Account already exists");
    }

    return res.status(500).send(e);
  }
}

export const verifyUserHandler = async (
  req: Request<VerifyUserInput>,
  res: Response
) => {
  const { id, verificationCode } = req.params;

  // Find the user by id
  const user = await findUserById(id);

  if (!user) {
    return res.send("Could not verify user");
  }

  // check to see if they are already verified
  if (user.verified) {
    return res.send("User is already verified");
  }

  // check to see if the verificationCode matches
  if (user.verificationCode === verificationCode) {
    await verifyUserById(id);

    return res.send("User successfully verified");
  }

  return res.send("Could not verify user");
};

export const logoutHandler = async (req: Request, res: Response) => {
  // Delete the accessToken on the client too

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  await deleteSessionToken(refreshToken);

  res.clearCookie("jwt", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  });
  res.sendStatus(204);
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, secure: true });

  const foundSession = await findSessionToken(refreshToken);

  // Detect refresh token reuse
  if (!foundSession) {
    try {
      // Bad user attempting reuse the refresh token
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JWT_PAYLOAD;
      console.log('decoded', decoded);
      
      // Delete all session for that decoded user
      await deleteUserSessions(decoded.userId);
    } catch (error) {
      return res.sendStatus(403); //Forbidden
    }

    
    return res.sendStatus(403); //Forbidden
  }

  // evaluate jwt

  res.sendStatus(204);
};
