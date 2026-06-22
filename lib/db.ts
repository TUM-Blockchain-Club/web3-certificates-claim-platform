import postgres from "postgres";
import { env } from "@/lib/env";

type GlobalWithSql = typeof globalThis & {
  certificateClaimSql?: postgres.Sql;
};

const globalWithSql = globalThis as GlobalWithSql;

export const sql =
  globalWithSql.certificateClaimSql ??
  postgres(env.DATABASE_URL, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 3,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalWithSql.certificateClaimSql = sql;
}

