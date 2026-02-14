function escapeValue(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: string[]): string {
  const header = columns.map(escapeValue).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeValue(row[column])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
