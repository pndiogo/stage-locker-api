import { sign, verify } from "hono/jwt";

import env from "@/env";

interface JWTPayload {
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

export async function generateLoginJWT({ sub }: JWTPayload) {
  const payload = {
    sub,
    iss: "Stage Locker API",
    aud: "Stage Locker Client",
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 6, // 6 months
    jti: crypto.randomUUID(),
  };

  const secret = env.JWT_SECRET;
  return await sign(payload, secret);
}

export async function generateUserVerificationJWT({ sub }: JWTPayload): Promise<string> {
  const payload = {
    sub,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
  };

  const secret = env.JWT_SECRET;
  return await sign(payload, secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const secret = env.JWT_SECRET;

  try {
    const payload = await verify(token, secret);
    return payload;
  }
  catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
