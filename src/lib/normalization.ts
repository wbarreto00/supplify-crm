export function normalizeText(value: string): string {
  return value.trim();
}

export function normalizeKey(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function normalizeEmail(value: string): string {
  return normalizeText(value).toLowerCase();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
