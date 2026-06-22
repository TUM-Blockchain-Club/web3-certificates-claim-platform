import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const TOKEN_TTL_SECONDS = 60 * 60;

type MagicLinkPayload = {
  exp: number;
  iat: number;
  recipientId: string;
  v: 1;
};

export type VerifiedMagicLink = {
  recipientId: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", env.MAGIC_LINK_SECRET)
    .update(payload)
    .digest("base64url");
}

export function createMagicLinkToken(recipientId: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: MagicLinkPayload = {
    exp: issuedAt + TOKEN_TTL_SECONDS,
    iat: issuedAt,
    recipientId,
    v: 1,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyMagicLinkToken(token: string): VerifiedMagicLink | null {
  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<MagicLinkPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      payload.v !== 1 ||
      typeof payload.recipientId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < now
    ) {
      return null;
    }

    return {
      recipientId: payload.recipientId,
    };
  } catch {
    return null;
  }
}

