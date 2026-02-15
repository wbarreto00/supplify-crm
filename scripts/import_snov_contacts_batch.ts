import fs from "node:fs";
import path from "node:path";
import { google, type sheets_v4 } from "googleapis";
import { TABLE_HEADERS } from "../src/lib/constants";

type ContactIn = {
  companyName: string;
  prospectId: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
};

type GenericRow = Record<string, string>;

function normalizeEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index);
    const value = line.slice(index + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function colLetter(index: number): string {
  let result = "";
  let current = index + 1;
  while (current > 0) {
    const rem = (current - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function toObject(row: string[], headers: readonly string[]): GenericRow {
  const out: GenericRow = {};
  headers.forEach((header, i) => {
    out[header] = row[i] ?? "";
  });
  return out;
}

function toRow(record: GenericRow, headers: readonly string[]): string[] {
  return headers.map((header) => record[header] ?? "");
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

async function getRows(sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string) {
  return withQuotaRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:Z`,
    });
    return res.data.values ?? [];
  }, `getRows:${sheetName}`);
}

async function writeRows(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  headers: readonly string[],
  rows: GenericRow[],
) {
  const values = [Array.from(headers), ...rows.map((row) => toRow(row, headers))];
  const endCol = colLetter(headers.length - 1);
  await withQuotaRetry(async () => {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${endCol}${values.length}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }, `writeRows:${sheetName}`);
}

function isQuotaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const anyErr = error as { status?: number; code?: number; message?: string };
  const status = anyErr.status ?? anyErr.code;
  if (status === 429) return true;
  const message = anyErr.message ?? "";
  return message.includes("Quota exceeded") || message.includes("RESOURCE_EXHAUSTED");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withQuotaRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let attempt = 0;
  // The quota is per-minute; waiting ~70s ensures the next minute window.
  const delaysMs = [5_000, 15_000, 30_000, 70_000, 70_000, 70_000];

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!isQuotaError(error) || attempt >= delaysMs.length) {
        throw error;
      }
      const delay = delaysMs[attempt] ?? 70_000;
      console.warn(`[quota] ${label} attempt=${attempt + 1} waiting_ms=${delay}`);
      await sleep(delay);
      attempt += 1;
    }
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadEnvFile(path.join(repoRoot, ".env.local"));

  const sheetId = normalizeEnv(process.env.GOOGLE_SHEET_ID);
  const clientEmail = normalizeEnv(process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  const privateKey = normalizeEnv(process.env.GOOGLE_SHEETS_PRIVATE_KEY).replace(/\\n/g, "\n");

  if (!sheetId || !clientEmail || !privateKey) {
    throw new Error("Google Sheets envs are missing");
  }

  const payloadPath = path.join(repoRoot, "data", "snov_contacts_payload.json");
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8")) as ContactIn[];

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const companyHeaders = TABLE_HEADERS.companies;
  const contactHeaders = TABLE_HEADERS.contacts;

  const [companyRowsRaw, contactRowsRaw] = await Promise.all([
    getRows(sheets, sheetId, "companies"),
    getRows(sheets, sheetId, "contacts"),
  ]);

  const companies = companyRowsRaw
    .filter((row) => (row[0] ?? "").trim() !== "")
    .map((row) => toObject(row, companyHeaders));
  const contacts = contactRowsRaw
    .filter((row) => (row[0] ?? "").trim() !== "")
    .map((row) => toObject(row, contactHeaders));

  const companyByName = new Map<string, GenericRow>();
  for (const company of companies) {
    companyByName.set(normalizeKey(company.name), company);
  }

  const contactByKey = new Map<string, GenericRow>();
  for (const contact of contacts) {
    const emailKey = normalizeKey(contact.email);
    const stableKey = emailKey ? `email::${emailKey}` : `name::${contact.companyId}::${normalizeKey(contact.name)}`;
    contactByKey.set(stableKey, contact);
  }

  let processed = 0;
  let upserted = 0;

  for (const item of payload) {
    processed += 1;
    const company = companyByName.get(normalizeKey(item.companyName));
    if (!company) {
      // Deals import should have created companies first; skip if missing.
      continue;
    }

    const now = nowIso();
    const email = (item.email ?? "").trim().toLowerCase();
    const stableKey = email ? `email::${email}` : `name::${company.id}::${normalizeKey(item.name)}`;

    const existing = contactByKey.get(stableKey);
    const id = existing?.id ?? `ctc_snov_${item.prospectId}`;

    const row: GenericRow = {
      id,
      companyId: company.id,
      name: item.name.trim() || `Prospect ${item.prospectId}`,
      role: (item.role ?? "").trim(),
      email,
      phone: (item.phone ?? "").trim(),
      linkedin: (item.linkedin ?? "").trim(),
      notes: (item.notes ?? "").trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, row);
    } else {
      contacts.push(row);
      contactByKey.set(stableKey, row);
    }
    upserted += 1;
  }

  await writeRows(sheets, sheetId, "contacts", contactHeaders, contacts);
  console.log(`DONE processed=${processed} upserted=${upserted} total_contacts=${contacts.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
