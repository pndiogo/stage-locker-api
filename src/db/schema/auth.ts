import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { emailSchema, passwordSchema } from "@/lib/schemas";

export const users = sqliteTable("user", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text().unique().notNull(),
  password: text().notNull(),
  verified: integer({ mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer({ mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const selectUserSchema = createSelectSchema(users).pick({
  id: true,
  email: true,
});

export const insertUserchema = createInsertSchema(users)
  .pick({
    email: true,
    password: true,
  })
  .extend({
    email: emailSchema,
    password: passwordSchema,
  });

export const loginUserchema = createSelectSchema(users)
  .pick({
    email: true,
    password: true,
  })
  .extend({
    email: emailSchema,
  });

export const loginUserchemaResponse = createSelectSchema(users)
  .pick({
    id: true,
    email: true,
  })
  .extend({
    token: z.string(),
  });
