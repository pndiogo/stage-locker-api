import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email format");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[@$!%*?&#]/, "Password must contain at least one special character (@, $, !, %, *, ?, &, #)");

export const users = sqliteTable("user", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text().unique().notNull(),
  password: text().notNull(),
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
