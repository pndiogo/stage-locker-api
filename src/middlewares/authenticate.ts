import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { verifyJwt } from "@/lib/jwt";

export const authenticate = createMiddleware<{
  Variables: {
    jwtUserId: string;
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

  c.set("jwtUserId", payload.sub as string);

  return next();
});
