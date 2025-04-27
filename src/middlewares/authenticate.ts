import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { User } from "@/lib/types";

import db from "@/db";
import { verifyJWT } from "@/lib/jwt";
import { emailSchema } from "@/lib/schemas";

export const authenticate = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { message: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyJWT(token);

  if (!payload) {
    return c.json(
      { message: "Invalid or expired token" },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const userId = payload.sub as string;

  if (!userId) {
    return c.json(
      { message: "Invalid token payload" },
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, userId);
    },
  });

  if (!user) {
    return c.json(
      { message: "Forbidden: User not found" },
      HttpStatusCodes.FORBIDDEN,
    );
  }

  if (!user.verified) {
    return c.json(
      { message: "Forbidden: Email not verified" },
      HttpStatusCodes.FORBIDDEN,
    );
  }

  c.set("user", user);

  return next();
});

export const verifyUserStatus = createMiddleware(async (c, next) => {
  let body: { email?: string } = {};

  try {
    body = await c.req.json();
  }
  catch {
    return c.json(
      { message: "Invalid or missing JSON body" },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  if (!body.email) {
    return c.json(
      { message: "Email is required" },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const email = body.email || "";
  const emailValidation = emailSchema.safeParse(email);

  if (!emailValidation.success) {
    return c.json(
      { message: emailValidation.error.errors[0].message },
      HttpStatusCodes.BAD_REQUEST,

    );
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email.trim().toLowerCase());
    },
  });

  if (!user) {
    return c.json(
      { message: "User not found" },
      HttpStatusCodes.NOT_FOUND,
    );
  }

  if (!user.verified) {
    return c.json(
      { message: "Forbidden: Email not verified" },
      HttpStatusCodes.FORBIDDEN,
    );
  }

  await next();
});
