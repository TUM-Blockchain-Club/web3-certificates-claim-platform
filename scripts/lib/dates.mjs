export function toIsoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const normalized = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  throw new Error("Expected a valid date value.");
}
