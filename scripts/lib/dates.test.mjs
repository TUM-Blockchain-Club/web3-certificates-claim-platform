import assert from "node:assert/strict";
import test from "node:test";
import { toIsoDate } from "./dates.mjs";

test("serializes Postgres date values as UTC ISO dates", () => {
  assert.equal(toIsoDate(new Date("2026-06-22T00:00:00.000Z")), "2026-06-22");
  assert.equal(toIsoDate("2026-06-22"), "2026-06-22");
});

test("rejects invalid date values", () => {
  assert.throws(() => toIsoDate("Mon Jun 22"), /valid date/);
});
