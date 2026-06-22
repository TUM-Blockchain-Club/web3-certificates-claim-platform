import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase";

const EMAIL_LIMIT_PER_HOUR = 3;
const IP_LIMIT_PER_HOUR = 30;
const WINDOW_SECONDS = 60 * 60;

function hashRateLimitKey(scope: string, value: string) {
  return createHmac("sha256", env.MAGIC_LINK_SECRET)
    .update(`${scope}:${value}`)
    .digest("hex");
}

function getClientIp(headerValue: string | null) {
  return headerValue?.split(",")[0]?.trim() || "unknown";
}

async function consumeRateLimit(
  keyHash: string,
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await supabaseAdmin.rpc(
    "consume_certificate_rate_limit",
    {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    },
  );

  if (error) {
    throw error;
  }

  return data === true;
}

export async function isClaimLinkRequestAllowed(emailNormalized: string) {
  const requestHeaders = await headers();
  const ip = getClientIp(
    requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip") ??
      requestHeaders.get("cf-connecting-ip"),
  );

  const [emailAllowed, ipAllowed] = await Promise.all([
    consumeRateLimit(
      hashRateLimitKey("claim-email", emailNormalized),
      EMAIL_LIMIT_PER_HOUR,
      WINDOW_SECONDS,
    ),
    consumeRateLimit(
      hashRateLimitKey("claim-ip", ip),
      IP_LIMIT_PER_HOUR,
      WINDOW_SECONDS,
    ),
  ]);

  return emailAllowed && ipAllowed;
}

