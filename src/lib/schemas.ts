import { z } from "zod";

export const emailSchema = z.string().email("Invalid email format");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[@$!%*?&#]/, "Password must contain at least one special character (@, $, !, %, *, ?, &, #)")
  .max(128, "Password must be at most 128 characters long")
  .refine(val => !val.includes(" "), "Password must not contain spaces")
  .refine(val => !val.includes("password"), "Password must not contain the word 'password'");

export const tokenSchema = z.string().min(1, "Token is required");
