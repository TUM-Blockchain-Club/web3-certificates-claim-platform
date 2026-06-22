"use server";

import { sendClaimLinkEmail } from "@/lib/mailgun";
import { createMagicLinkToken, verifyMagicLinkToken } from "@/lib/magic-link";
import {
  getRecipientByEmail,
  savePreference,
  writeAuditEvent,
} from "@/lib/recipients";
import { isClaimLinkRequestAllowed } from "@/lib/rate-limit";
import { isEvmAddress } from "@/lib/wallet";
import { env } from "@/lib/env";

const NEUTRAL_EMAIL_MESSAGE =
  "If this email is eligible, a claim link will arrive shortly.";

export type EmailRequestState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type NftPreferenceState = {
  status: "idle" | "success" | "error";
  message: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function requestClaimLink(
  _previousState: EmailRequestState,
  formData: FormData,
): Promise<EmailRequestState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  try {
    const allowed = await isClaimLinkRequestAllowed(email);

    if (!allowed) {
      return {
        status: "success",
        message: NEUTRAL_EMAIL_MESSAGE,
      };
    }

    const recipient = await getRecipientByEmail(email);

    if (recipient) {
      const token = createMagicLinkToken(recipient.id);
      const claimUrl = new URL("/claim", env.NEXT_PUBLIC_SITE_URL);
      claimUrl.searchParams.set("token", token);

      await sendClaimLinkEmail({
        certificateName: recipient.certificateName,
        claimUrl: claimUrl.toString(),
        participantName: recipient.participantName,
        to: recipient.email,
      });

      await writeAuditEvent(recipient.id, "claim_link_sent", {
        domain: env.MAILGUN_DOMAIN,
      });
    }
  } catch (error) {
    console.error("Failed to process claim-link request", error);
  }

  return {
    status: "success",
    message: NEUTRAL_EMAIL_MESSAGE,
  };
}

export async function saveNftPreference(
  _previousState: NftPreferenceState,
  formData: FormData,
): Promise<NftPreferenceState> {
  const token = String(formData.get("token") ?? "");
  const payload = verifyMagicLinkToken(token);

  if (!payload) {
    return {
      status: "error",
      message: "The claim link is expired. Request a new link.",
    };
  }

  const destinationType = String(formData.get("destinationType") ?? "none");
  const rawAddress = String(formData.get("evmAddress") ?? "").trim();

  if (
    destinationType !== "evm_wallet" &&
    destinationType !== "tbc_wallet" &&
    destinationType !== "none"
  ) {
    return {
      status: "error",
      message: "Choose a valid NFT option.",
    };
  }

  if (destinationType === "evm_wallet" && !isEvmAddress(rawAddress)) {
    return {
      status: "error",
      message: "Enter a valid EVM wallet address.",
    };
  }

  try {
    await savePreference({
      destinationType,
      evmAddress: destinationType === "evm_wallet" ? rawAddress : null,
      recipientId: payload.recipientId,
    });

    await writeAuditEvent(payload.recipientId, "nft_preference_saved", {
      destinationType,
    });

    return {
      status: "success",
      message: "NFT preference saved.",
    };
  } catch (error) {
    console.error("Failed to save NFT preference", error);

    return {
      status: "error",
      message: "The preference could not be saved.",
    };
  }
}
