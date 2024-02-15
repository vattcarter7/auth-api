import z from "zod";

export const loginWithEmailAndPassword = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email or password"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Invalid email or password"),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string({
      required_error: "First name is required",
    }),
    lastName: z.string({
      required_error: "Last name is required",
    }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Not a valid email"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password is too short - at least 6 characters"),
  }),
});

export type LoginWithEmailAndPasswordInput = z.infer<
  typeof loginWithEmailAndPassword
>["body"];

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
