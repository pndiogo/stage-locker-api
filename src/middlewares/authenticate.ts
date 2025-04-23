import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { User } from "@/lib/types";

import db from "@/db";
import { verifyJwt } from "@/lib/jwt";

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
  const payload = await verifyJwt(token);

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

  c.set("user", user);

  return next();
});
