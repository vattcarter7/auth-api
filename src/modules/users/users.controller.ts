import { Request, Response } from "express";
import {
  CreateUserInput,
  LoginWithEmailAndPasswordInput,
} from "./users.schemas";
import sendEmail from "../../utils/mailer";
import { createUser } from "./users.services";
import { nanoid } from "nanoid";
import argon2 from "argon2";

export const loginWithEmailAndPasswordHandler = (
  req: Request<{}, {}, LoginWithEmailAndPasswordInput>,
  res: Response
) => {
  const { email, password } = req.body;
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
