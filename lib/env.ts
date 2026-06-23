import { z } from "zod";

const envSchema = {
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
} satisfies Record<string, z.ZodType>;

type Env = {
  [Key in keyof typeof envSchema]: z.infer<(typeof envSchema)[Key]>;
};

export const env = new Proxy({} as Env, {
  get(_target, property) {
    if (typeof property !== "string" || !(property in envSchema)) {
      return undefined;
    }

    return envSchema[property as keyof typeof envSchema].parse(
      process.env[property],
    );
  },
});
