import { sign, verify } from "hono/jwt";

import env from "@/env";

interface JwtPayload {
  sub: string;
}

export async function signJwt({ sub }: JwtPayload) {
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
  const token = await sign(payload, secret);

  return token;
}

export async function verifyJwt(token: string) {
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
