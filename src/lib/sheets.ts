import { TABLE_HEADERS, type TableName } from "@/lib/constants";
import { getGoogleSheetConfig } from "@/lib/env";
import type { TableRecord } from "@/lib/types";
import { google, type sheets_v4 } from "googleapis";

function getColumnLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

type InMemoryDb = Record<TableName, TableRecord[]>;
type GlobalWithDb = typeof globalThis & {
  __SUPPLIFY_IN_MEMORY_DB__?: InMemoryDb;
};

function createInMemoryDb(): InMemoryDb {
  return {
    companies: [],
    contacts: [],
    deals: [],
    activities: [],
  };
}

function getInMemoryDb(): InMemoryDb {
  const globalWithDb = globalThis as GlobalWithDb;
  if (!globalWithDb.__SUPPLIFY_IN_MEMORY_DB__) {
    globalWithDb.__SUPPLIFY_IN_MEMORY_DB__ = createInMemoryDb();
  }
  return globalWithDb.__SUPPLIFY_IN_MEMORY_DB__;
}

let cachedSheetsClient: sheets_v4.Sheets | null = null;
const ensuredTables = new Set<TableName>();

type ListCacheEntry = { at: number; rows: TableRecord[] };
const listCache = new Map<TableName, ListCacheEntry>();
const LIST_CACHE_TTL_MS = 4000;

function usingMemoryMode(): boolean {
  return process.env.USE_IN_MEMORY_DB === "1" || getGoogleSheetConfig() === null;
}

async function getSheetsClient(): Promise<{ client: sheets_v4.Sheets; sheetId: string } | null> {
  const config = getGoogleSheetConfig();
  if (!config) {
    return null;
  }

  if (!cachedSheetsClient) {
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    cachedSheetsClient = google.sheets({ version: "v4", auth });
  }

  return { client: cachedSheetsClient, sheetId: config.sheetId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const anyError = error as { code?: number; status?: number; message?: string };
  const status = anyError?.status ?? anyError?.code;
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  const msg = String(anyError?.message ?? "");
  return msg.includes("429") || msg.includes("Rate Limit") || msg.includes("quota") || msg.includes("Quota");
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [250, 800, 2000, 4500];
  let lastErr: unknown;
  for (let i = 0; i < delays.length; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err)) break;
      console.warn("[sheets.retry]", { label, attempt: i + 1, delayMs: delays[i] });
      await sleep(delays[i]);
    }
  }
  throw lastErr;
}

function migrateCompanyStatusToStage(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "lead") return "new";
  if (normalized === "prospect") return "qualified";
  if (normalized === "active") return "won";
  if (normalized === "lost") return "lost";
  return "new";
}

async function maybeMigrateCompanies(
  client: sheets_v4.Sheets,
  sheetId: string,
  currentHeaders: string[],
): Promise<boolean> {
  const wantsStage = TABLE_HEADERS.companies.includes("stage");
  const isOld =
    wantsStage &&
    (currentHeaders.includes("status") || currentHeaders.includes("segment") || currentHeaders.includes("size")) &&
    !currentHeaders.includes("stage");

  if (!isOld) return false;

  const headerIndex = new Map<string, number>();
  currentHeaders.forEach((h, i) => headerIndex.set(h, i));

  const existing = await withRetry(
    () =>
      client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `companies!A2:Z`,
      }),
    "companies.values.get",
  );
  const rows = existing.data.values ?? [];

  const dealsExisting = await withRetry(
    () =>
      client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `deals!A2:Z`,
      }),
    "deals.values.get(for-company-migration)",
  );
  const dealRows = dealsExisting.data.values ?? [];
  const dealHeaders = TABLE_HEADERS.deals;
  const dealIndex = new Map<string, number>();
  dealHeaders.forEach((h, i) => dealIndex.set(h, i));
  const latestStageByCompanyId = new Map<string, { stage: string; updatedAt: string }>();
  for (const row of dealRows) {
    const companyId = String(row[dealIndex.get("companyId") ?? -1] ?? "");
    const stage = String(row[dealIndex.get("stage") ?? -1] ?? "");
    const updatedAt = String(row[dealIndex.get("updatedAt") ?? -1] ?? "");
    if (!companyId) continue;
    const prev = latestStageByCompanyId.get(companyId);
    if (!prev || updatedAt.localeCompare(prev.updatedAt) > 0) {
      latestStageByCompanyId.set(companyId, { stage, updatedAt });
    }
  }

  const newHeaders = TABLE_HEADERS.companies;
  const values: string[][] = [Array.from(newHeaders)];

  for (const row of rows) {
    const get = (key: string) => String(row[headerIndex.get(key) ?? -1] ?? "");
    const id = get("id");
    const name = get("name");
    const owner = get("owner");
    const source = get("source");
    const notes = get("notes");
    const createdAt = get("createdAt");
    const updatedAt = get("updatedAt");

    const segment = get("segment").trim();
    const size = get("size").trim();
    const status = get("status");
    const inferredStage =
      latestStageByCompanyId.get(id)?.stage ||
      migrateCompanyStatusToStage(status);
    const stage = newHeaders.includes("stage") ? inferredStage : "";

    let mergedNotes = notes ?? "";
    const extras: string[] = [];
    if (segment) extras.push(`Segmento (antigo): ${segment}`);
    if (size) extras.push(`Tamanho (antigo): ${size}`);
    if (extras.length > 0) {
      mergedNotes = `${mergedNotes}${mergedNotes ? "\n\n" : ""}${extras.join("\n")}`;
    }

    const record: Record<string, string> = {
      id,
      name,
      stage,
      owner,
      source,
      notes: mergedNotes,
      createdAt,
      updatedAt,
    };

    values.push(newHeaders.map((h) => record[h] ?? ""));
  }

  const endCol = getColumnLetter(newHeaders.length - 1);
  await withRetry(
    () =>
      client.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `companies!A1:${endCol}${values.length}`,
        valueInputOption: "RAW",
        requestBody: { values },
      }),
    "companies.values.update(migrate)",
  );

  return true;
}

async function ensureSheet(table: TableName): Promise<void> {
  if (usingMemoryMode()) {
    return;
  }

  if (ensuredTables.has(table)) {
    return;
  }

  const clientResult = await getSheetsClient();
  if (!clientResult) {
    return;
  }

  const { client, sheetId } = clientResult;
  const metadata = await withRetry(() => client.spreadsheets.get({ spreadsheetId: sheetId }), "spreadsheets.get");
  const sheetExists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === table);

  if (!sheetExists) {
    await withRetry(
      () =>
        client.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: table },
                },
              },
            ],
          },
        }),
      "spreadsheets.batchUpdate(addSheet)",
    );
  }

  const headers = TABLE_HEADERS[table];
  const firstRow = await withRetry(
    () =>
      client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${table}!1:1`,
      }),
    `${table}.values.get(header)`,
  );

  const currentHeaders = firstRow.data.values?.[0] ?? [];

  if (table === "companies") {
    const migrated = await maybeMigrateCompanies(client, sheetId, currentHeaders.map(String));
    if (migrated) {
      // Headers + values already rewritten, don't try to update headers again here.
      ensuredTables.add(table);
      listCache.delete(table);
      return;
    }
  }

  const shouldUpdateHeaders =
    currentHeaders.length !== headers.length ||
    headers.some((header, index) => currentHeaders[index] !== header);

  if (shouldUpdateHeaders) {
    await withRetry(
      () =>
        client.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${table}!A1:${getColumnLetter(headers.length - 1)}1`,
          valueInputOption: "RAW",
          requestBody: { values: [Array.from(headers)] },
        }),
      `${table}.values.update(headers)`,
    );
  }

  ensuredTables.add(table);
}

function mapRowToRecord<T extends TableName>(table: T, row: string[]): TableRecord<T> {
  const headers = TABLE_HEADERS[table];
  return headers.reduce((acc, header, index) => {
    (acc as Record<string, string>)[header] = row[index] ?? "";
    return acc;
  }, {} as TableRecord<T>);
}

function mapRecordToRow<T extends TableName>(table: T, record: Partial<TableRecord<T>>): string[] {
  const headers = TABLE_HEADERS[table];
  const unsafeRecord = record as Record<string, string | undefined>;
  return headers.map((header) => unsafeRecord[header] ?? "");
}

export async function list<T extends TableName>(table: T): Promise<TableRecord<T>[]> {
  if (usingMemoryMode()) {
    return getInMemoryDb()[table] as TableRecord<T>[];
  }

  const cached = listCache.get(table);
  const now = Date.now();
  if (cached && now - cached.at < LIST_CACHE_TTL_MS) {
    return cached.rows as TableRecord<T>[];
  }

  await ensureSheet(table);
  const clientResult = await getSheetsClient();
  if (!clientResult) {
    return [];
  }

  const { client, sheetId } = clientResult;

  try {
    const response = await withRetry(
      () =>
        client.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${table}!A2:Z`,
        }),
      `${table}.values.get`,
    );

    const rows = response.data.values ?? [];
    const mapped = rows
      .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      .map((row) => mapRowToRecord(table, row));

    listCache.set(table, { at: now, rows: mapped as TableRecord[] });
    return mapped;
  } catch (error) {
    console.error("[sheets.list] error", { table, error });
    // Prefer stale cache over empty screens.
    if (cached) {
      return cached.rows as TableRecord<T>[];
    }
    return [];
  }
}

export async function getById<T extends TableName>(table: T, id: string): Promise<TableRecord<T> | null> {
  const rows = await list(table);
  return rows.find((row) => row.id === id) ?? null;
}

export async function upsert<T extends TableName>(
  table: T,
  record: TableRecord<T>,
  matchBy: (keyof TableRecord<T>)[] = ["id"],
): Promise<TableRecord<T>> {
  if (usingMemoryMode()) {
    const db = getInMemoryDb();
    const index = db[table].findIndex((row) =>
      matchBy.every((key) => row[key] === record[key]),
    );
    if (index >= 0) {
      db[table][index] = { ...db[table][index], ...record } as TableRecord;
      return db[table][index] as TableRecord<T>;
    }
    db[table].push(record as TableRecord);
    return record;
  }

  await ensureSheet(table);
  const clientResult = await getSheetsClient();
  if (!clientResult) {
    throw new Error("Google Sheets is not configured");
  }

  const { client, sheetId } = clientResult;
  const existing = await withRetry(
    () =>
      client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${table}!A2:Z`,
      }),
    `${table}.values.get(for-upsert)`,
  );
  const rows = existing.data.values ?? [];

  const headers = TABLE_HEADERS[table];
  const idIndexMap = new Map<string, number>();
  headers.forEach((header, index) => {
    idIndexMap.set(header, index);
  });

  const matchIndex = rows.findIndex((row) =>
    matchBy.every((key) => {
      const keyIndex = idIndexMap.get(key as string);
      return keyIndex !== undefined && (row[keyIndex] ?? "") === (record[key] ?? "");
    }),
  );

  const rowData = mapRecordToRow(table, record);

  if (matchIndex >= 0) {
    const rowNumber = matchIndex + 2;
    await withRetry(
      () =>
        client.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${table}!A${rowNumber}:${getColumnLetter(headers.length - 1)}${rowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [rowData] },
        }),
      `${table}.values.update(row)`,
    );
  } else {
    await withRetry(
      () =>
        client.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: `${table}!A2`,
          valueInputOption: "RAW",
          requestBody: { values: [rowData] },
        }),
      `${table}.values.append`,
    );
  }

  listCache.delete(table);
  return record;
}

export async function remove<T extends TableName>(table: T, id: string): Promise<boolean> {
  if (usingMemoryMode()) {
    const db = getInMemoryDb();
    const index = db[table].findIndex((row) => row.id === id);
    if (index < 0) return false;
    db[table].splice(index, 1);
    return true;
  }

  await ensureSheet(table);
  const clientResult = await getSheetsClient();
  if (!clientResult) {
    return false;
  }

  const { client, sheetId } = clientResult;
  const metadata = await withRetry(() => client.spreadsheets.get({ spreadsheetId: sheetId }), "spreadsheets.get(for-remove)");
  const sheet = metadata.data.sheets?.find((item) => item.properties?.title === table);
  const sheetInternalId = sheet?.properties?.sheetId;
  if (sheetInternalId === undefined) {
    return false;
  }

  const existing = await withRetry(
    () =>
      client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${table}!A2:Z`,
      }),
    `${table}.values.get(for-remove)`,
  );
  const rows = existing.data.values ?? [];
  const headers = TABLE_HEADERS[table];
  const idIndex = headers.findIndex((header) => header === "id");

  const matchIndex = rows.findIndex((row) => (row[idIndex] ?? "") === id);
  if (matchIndex < 0) {
    return false;
  }

  const startRowIndex = matchIndex + 1;
  await withRetry(
    () =>
      client.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetInternalId,
                  dimension: "ROWS",
                  startIndex: startRowIndex,
                  endIndex: startRowIndex + 1,
                },
              },
            },
          ],
        },
      }),
    `${table}.batchUpdate(deleteRow)`,
  );

  listCache.delete(table);
  return true;
}

export async function search<T extends TableName>(table: T, query: string): Promise<TableRecord<T>[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return list(table);
  }

  const rows = await list(table);
  return rows.filter((row) =>
    Object.values(row).some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function resetInMemoryDb(): void {
  const globalWithDb = globalThis as GlobalWithDb;
  globalWithDb.__SUPPLIFY_IN_MEMORY_DB__ = createInMemoryDb();
}
