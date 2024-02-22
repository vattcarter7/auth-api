import { Request, Response } from "express";
import { nanoid } from "nanoid";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import {
  CreateUserInput,
  ForgotPasswordInput,
  LoginWithEmailAndPasswordInput,
  VerifyUserInput,
} from "./users.schemas";
import sendEmail from "../../utils/mailer";
import {
  createUser,
  createSessionToken,
  deleteSessionToken,
  deleteUserSessions,
  findSessionToken,
  findUserByEmail,
  findUserById,
  verifyUserById,
  updateResetPasswordCode,
} from "./users.services";
import { env } from "../../constants/env";

type JWT_PAYLOAD = {
  userId: string;
};

const ACCESS_TOKEN_EXPIRE = "15m";
const REFRESH_TOKEN_EXPIRE = "1y";
const JWT_COOKIE_EXPIRE = 12 * 30 * 24 * 60 * 60 * 1000; // 1 year

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
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRE,
    }
  );

  const refreshToken = jwt.sign({ userId: user.id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRE,
  });

  await createSessionToken({ userId: user.id, sessionToken: refreshToken });

  // Creates Secure Cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: JWT_COOKIE_EXPIRE,
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
      from: "carter@vattsopheak.com",
      subject: "Verify your email",
      text: `verification code: ${user.verificationCode} - Id: ${user.id}`,
    });

    return res.send("User successfully created");
  } catch (e: any) {
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
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  });

  const foundSession = await findSessionToken(refreshToken);

  // Detect refresh token reuse
  if (!foundSession) {
    try {
      // Bad user attempting reuse the refresh token
      const decoded = jwt.verify(
        refreshToken,
        env.REFRESH_TOKEN_SECRET
      ) as JWT_PAYLOAD;

      // Delete all sessions for that decoded user
      await deleteUserSessions(decoded.userId);
    } catch (error) {
      return res.sendStatus(403); // Forbidden
    }

    return res.sendStatus(403); // Forbidden
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      env.REFRESH_TOKEN_SECRET
    ) as JWT_PAYLOAD;

    if (decoded.userId !== foundSession.userId) {
      return res.sendStatus(403); // Forbidden
    }

    // evaluate jwt
    const newRefreshToken = jwt.sign(
      { userId: foundSession.userId },
      env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRE,
      }
    );

    const accessToken = jwt.sign(
      {
        userId: foundSession.userId,
      },
      env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRE,
      }
    );

    // Delete old session from db
    await deleteSessionToken(refreshToken);

    // create new session into db
    await createSessionToken({
      userId: foundSession.userId,
      sessionToken: newRefreshToken,
    });

    // Create Secure Cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      maxAge: JWT_COOKIE_EXPIRE,
    });

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    await deleteSessionToken(refreshToken);
    return res.sendStatus(403); // Forbidden
  }
};

export async function forgotPasswordHandler(
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
) {
  const message =
    "You will receive a password reset email if the user with that email is registered";

  const { email } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.send(message);
  }

  if (!user.verified) {
    return res.send("User is not verified");
  }

  const passwordResetCode = nanoid();

  user.passwordResetCode = passwordResetCode;

  await updateResetPasswordCode(user.id, passwordResetCode);

  await sendEmail({
    to: user.email,
    from: "carter@vattsopheak.com",
    subject: "Reset your password",
    text: `Password reset code: ${passwordResetCode} - Id ${user.id}`,
  });

  return res.send(message);
}
