import zod, { object, string } from "zod";

export const loginWithEmailAndPassword = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email("Invalid email or password"),
    password: string({
      required_error: "Password is required",
    }).min(6, "Invalid email or password"),
  }),
});

export const createUserSchema = object({
  body: object({
    firstName: string({
      required_error: "First name is required",
    }),
    lastName: string({
      required_error: "Last name is required",
    }),
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
    password: string({
      required_error: "Password is required",
    }).min(6, "Password is too short - at least 6 characters"),
  }),
});

export const verifyUserSchema = object({
  params: object({
    id: string(),
    verificationCode: string(),
  }),
});

export type LoginWithEmailAndPasswordInput = zod.infer<
  typeof loginWithEmailAndPassword
>["body"];

export type CreateUserInput = zod.infer<typeof createUserSchema>["body"];

export type VerifyUserInput = zod.infer<typeof verifyUserSchema>["params"];
