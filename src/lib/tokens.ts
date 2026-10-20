import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.AUTH_SECRET ?? process.env.TOKEN_SECRET ?? "studentos-development-token-secret";
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

export interface TokenPayload {
  [key: string]: string | number | boolean | null | undefined;
  exp?: number;
}

/** Signs a compact JSON payload. Used for unsubscribe, confirm and share links. */
export function signToken(payload: TokenPayload, ttlSeconds = 60 * 60 * 24 * 30): string {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const encoded = base64url(JSON.stringify(body));
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyToken<T extends TokenPayload = TokenPayload>(token: string | null | undefined): T | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function appUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
