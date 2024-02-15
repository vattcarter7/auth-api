import { InferInsertModel } from "drizzle-orm";
import { users } from "../../db/schemas/users";
import { db } from "../../db";


export const createUser = async (input: InferInsertModel<typeof users>) => {
  const result = await db.insert(users).values(input).returning();

  return result[0];
}