export function formDataToObject(formData: FormData): Record<string, unknown> {
  const entries = Array.from(formData.entries()).map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
  return Object.fromEntries(entries);
}

export function safeRedirectPath(value: unknown, fallbackPath: string): string {
  if (typeof value !== "string") {
    return fallbackPath;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallbackPath;
  }

  return value;
}

export function appendError(path: string, code: string): string {
  const [base, queryString] = path.split("?");
  const searchParams = new URLSearchParams(queryString ?? "");
  searchParams.set("error", code);
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}
