#!/usr/bin/env node

import "dotenv/config";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

if (!process.env.DATABASE_URL) {
  console.error("Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

const migrationsDir = "supabase/migrations";
const migrations = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => join(migrationsDir, file));

for (const migration of migrations) {
  console.log(`Applying ${migration}`);

  const child = spawn(
    "psql",
    [
      process.env.DATABASE_URL,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      migration,
    ],
    {
      stdio: "inherit",
    },
  );

  const exitCode = await new Promise((resolve) => {
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exit(Number(exitCode));
  }
}
