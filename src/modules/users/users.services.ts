import { InferInsertModel, eq } from "drizzle-orm";
import { users } from "../../db/schemas/users";
import { db } from "../../db";
import { sessions } from "../../db/schemas/sessions";

export const createUser = async (input: InferInsertModel<typeof users>) => {
  const result = await db.insert(users).values(input).returning();

  return result[0];
};

export const findUserById = async (id: string) => {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result[0];
};

export const verifyUserById = async (id: string) => {
  await db.update(users).set({ verified: true }).where(eq(users.id, id));
};

export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0];
};

export const createUserSessionToken = async (
  data: InferInsertModel<typeof sessions>
) => {
  await db
    .insert(sessions)
    .values({ sessionToken: data.sessionToken, userId: data.userId });
};

export const deleteSessionToken = async (session: string) => {
  const result = await db.delete(sessions).where(eq(sessions.sessionToken, session)).returning();

  return result[0];
}