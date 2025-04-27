import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { emailSchema } from "@/lib/schemas";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(limit: number, windowMs: number) {
  return createMiddleware(async (c, next) => {
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

    const key = `rate-limit:${email}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (entry) {
      if (entry.resetTime > now) {
        if (entry.count >= limit) {
          return c.json(
            { message: "Rate limit exceeded" },
            HttpStatusCodes.TOO_MANY_REQUESTS,
          );
        }

        entry.count += 1;
      }
      else {
        entry.count = 1;
        entry.resetTime = now + windowMs;
      }
    }
    else {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    }

    await next();
  });
}
