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
  findUserByEmail,
  findUserById,
  verifyUserById,
} from "./users.services";
import { env } from "../../constants/env";

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
