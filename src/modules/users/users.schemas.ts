import zod, { object, string } from "zod";

export const loginWithEmailAndPasswordSchema = object({
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

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email("Not a valid email"),
  }),
});

export const resetPasswordSchema = object({
  params: object({
    id: string(),
    passwordResetCode: string(),
  }),
  body: object({
    password: string({
      required_error: "Password is required",
    }).min(6, "Password is too short - at least 6 character"),
  }),
});

export type LoginWithEmailAndPasswordInput = zod.infer<
  typeof loginWithEmailAndPasswordSchema
>["body"];

export type CreateUserInput = zod.infer<typeof createUserSchema>["body"];

export type VerifyUserInput = zod.infer<typeof verifyUserSchema>["params"];

export type ForgotPasswordInput = zod.infer<
  typeof forgotPasswordSchema
>["body"];

export type ResetPasswordInput = zod.infer<typeof resetPasswordSchema>;
