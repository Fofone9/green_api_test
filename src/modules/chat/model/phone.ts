export function normalizePhone(value: string): string {
  return value
    .trim()
    .replace(/^\+/, "")
    .replace(/[\s()-]/g, "");
}

export function isValidPhone(value: string): boolean {
  return /^[1-9]\d{6,14}$/.test(value);
}
