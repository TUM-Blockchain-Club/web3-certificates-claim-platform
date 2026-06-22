#!/usr/bin/env node

import "dotenv/config";
import { spawn } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error("Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

const child = spawn(
  "psql",
  [
    process.env.DATABASE_URL,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "supabase/migrations/202606220001_create_certificate_tables.sql",
  ],
  {
    stdio: "inherit",
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
