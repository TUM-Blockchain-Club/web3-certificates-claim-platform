export function derivePublicName(fullName) {
  const normalized = String(fullName ?? "").trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");

  if (parts.length < 2) {
    throw new Error(`Name needs a preferred first name and family name: ${fullName}`);
  }

  const preferredFirstName = parts[0];
  const familyName = parts.at(-1);
  const familyInitial = [...familyName][0]?.toLocaleUpperCase();

  if (!familyInitial) {
    throw new Error(`Family name is empty: ${fullName}`);
  }

  return {
    familyName,
    fullName: normalized,
    preferredFirstName,
    publicDisplayName: `${preferredFirstName} ${familyInitial}.`,
  };
}
