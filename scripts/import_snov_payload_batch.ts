import fs from "node:fs";
import path from "node:path";
import { google, type sheets_v4 } from "googleapis";
import { TABLE_HEADERS } from "../src/lib/constants";

type ImportDeal = {
  snovDealId: number;
  companyName: string;
  title: string;
  stage: "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
  setupValue: number;
  monthlyValue: number;
  probability: number;
  closeDate: string;
  owner: string;
  notes: string;
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

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
  });
  return res.data.values ?? [];
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
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:${endCol}${values.length}`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
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

  const payloadPath = path.join(repoRoot, "data", "snov_import_payload.json");
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8")) as ImportDeal[];

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const companyHeaders = TABLE_HEADERS.companies;
  const dealHeaders = TABLE_HEADERS.deals;

  const [companyRowsRaw, dealRowsRaw] = await Promise.all([
    getRows(sheets, sheetId, "companies"),
    getRows(sheets, sheetId, "deals"),
  ]);

  const companies = companyRowsRaw
    .filter((row) => (row[0] ?? "").trim() !== "")
    .map((row) => toObject(row, companyHeaders));
  const deals = dealRowsRaw
    .filter((row) => (row[0] ?? "").trim() !== "")
    .map((row) => toObject(row, dealHeaders));

  const companyByName = new Map<string, GenericRow>();
  for (const company of companies) {
    companyByName.set(normalizeKey(company.name), company);
  }

  const dealByKey = new Map<string, GenericRow>();
  for (const deal of deals) {
    const key = `${deal.companyId}::${normalizeKey(deal.title)}`;
    dealByKey.set(key, deal);
  }

  let upsertedCompanies = 0;
  let upsertedDeals = 0;

  for (const item of payload) {
    const companyName = item.companyName.trim() || `Company Snov ${item.snovDealId}`;
    const companyKey = normalizeKey(companyName);
    const now = nowIso();

    let company = companyByName.get(companyKey);

    if (!company) {
      company = {
        id: createId("cmp"),
        name: companyName,
        segment: "",
        size: "",
        owner: item.owner,
        status: "prospect",
        source: "snov.io",
        notes: `Imported from Snov.io (deal ${item.snovDealId})`,
        createdAt: now,
        updatedAt: now,
      };
      companies.push(company);
      companyByName.set(companyKey, company);
    } else {
      company.owner = item.owner || company.owner;
      company.source = company.source || "snov.io";
      company.status = company.status || "prospect";
      company.updatedAt = now;
    }
    upsertedCompanies += 1;

    const dealKey = `${company.id}::${normalizeKey(item.title)}`;
    let deal = dealByKey.get(dealKey);

    if (!deal) {
      deal = {
        id: createId("deal"),
        companyId: company.id,
        title: item.title,
        stage: item.stage,
        value: String(item.value),
        setupValue: String(item.setupValue),
        monthlyValue: String(item.monthlyValue),
        probability: String(item.probability),
        closeDate: item.closeDate,
        owner: item.owner,
        notes: item.notes,
        createdAt: now,
        updatedAt: now,
      };
      deals.push(deal);
      dealByKey.set(dealKey, deal);
    } else {
      deal.stage = item.stage;
      deal.value = String(item.value);
      deal.setupValue = String(item.setupValue);
      deal.monthlyValue = String(item.monthlyValue);
      deal.probability = String(item.probability);
      deal.closeDate = item.closeDate;
      deal.owner = item.owner;
      deal.notes = item.notes;
      deal.updatedAt = now;
    }

    upsertedDeals += 1;
  }

  await Promise.all([
    writeRows(sheets, sheetId, "companies", companyHeaders, companies),
    writeRows(sheets, sheetId, "deals", dealHeaders, deals),
  ]);

  console.log(`DONE companies_processed=${upsertedCompanies} deals_processed=${upsertedDeals}`);
  console.log(`TOTAL_COMPANIES=${companies.length} TOTAL_DEALS=${deals.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
