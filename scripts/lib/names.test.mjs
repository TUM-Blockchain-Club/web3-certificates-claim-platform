import assert from "node:assert/strict";
import test from "node:test";
import { derivePublicName, validatePublicDisplayName } from "./names.mjs";

test("derives the public name from first and final name parts", () => {
  assert.deepEqual(derivePublicName("  Mohamed   Aymane Dhimni "), {
    familyName: "Dhimni",
    fullName: "Mohamed Aymane Dhimni",
    preferredFirstName: "Mohamed",
    publicDisplayName: "Mohamed D.",
  });
});

test("preserves hyphenated and Unicode names", () => {
  assert.equal(
    derivePublicName("Marie-Sophie Wuellner").publicDisplayName,
    "Marie-Sophie W.",
  );
  assert.equal(derivePublicName("Kevin Müller").publicDisplayName, "Kevin M.");
});

test("rejects names that cannot be split safely", () => {
  assert.throws(() => derivePublicName("Madonna"), /preferred first name and family name/);
});

test("accepts reviewed public names and rejects full names", () => {
  assert.equal(validatePublicDisplayName("Ada L."), "Ada L.");
  assert.throws(
    () => validatePublicDisplayName("Ada Lovelace"),
    /first name and family-name initial/,
  );
});
