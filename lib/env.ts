import { z } from "zod";

const envSchema = z.object({
  CERTIFICATE_COHORT: z.string().min(1).default("Cohort 1"),
  CERTIFICATE_ISSUED_ON: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  CERTIFICATE_NAME: z.string().min(1).default("Web3 Talents Certificate"),
  CERTIFICATES_BASE_URL: z
    .string()
    .url()
    .default("https://certificates.web3-talents.com"),
  MAGIC_LINK_SECRET: z.string().min(32),
  MAILGUN_API_KEY: z.string().min(1),
  MAILGUN_DOMAIN: z.string().min(1),
  MAILGUN_FROM_EMAIL: z.string().email(),
  MAILGUN_FROM_NAME: z.string().min(1).default("Web3Talents"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://claim-platform.web3-talents.com"),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
