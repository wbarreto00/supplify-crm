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

async function ensureSheet(table: TableName): Promise<void> {
  if (usingMemoryMode()) {
    return;
  }

  const clientResult = await getSheetsClient();
  if (!clientResult) {
    return;
  }

  const { client, sheetId } = clientResult;
  const metadata = await client.spreadsheets.get({ spreadsheetId: sheetId });
  const sheetExists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === table);

  if (!sheetExists) {
    await client.spreadsheets.batchUpdate({
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
    });
  }

  const headers = TABLE_HEADERS[table];
  const firstRow = await client.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${table}!1:1`,
  });

  const currentHeaders = firstRow.data.values?.[0] ?? [];
  const shouldUpdateHeaders =
    currentHeaders.length !== headers.length ||
    headers.some((header, index) => currentHeaders[index] !== header);

  if (shouldUpdateHeaders) {
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${table}!A1:${getColumnLetter(headers.length - 1)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [Array.from(headers)] },
    });
  }
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

  try {
    await ensureSheet(table);
    const clientResult = await getSheetsClient();
    if (!clientResult) {
      return [];
    }

    const { client, sheetId } = clientResult;
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${table}!A2:Z`,
    });

    const rows = response.data.values ?? [];
    return rows
      .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      .map((row) => mapRowToRecord(table, row));
  } catch (error) {
    // Avoid crashing the whole app when Sheets is rate-limited or transiently unavailable.
    console.error("[sheets.list] error", { table, error });
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
  const existing = await client.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${table}!A2:Z`,
  });
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
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${table}!A${rowNumber}:${getColumnLetter(headers.length - 1)}${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [rowData] },
    });
  } else {
    await client.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${table}!A2`,
      valueInputOption: "RAW",
      requestBody: { values: [rowData] },
    });
  }

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
  const metadata = await client.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = metadata.data.sheets?.find((item) => item.properties?.title === table);
  const sheetInternalId = sheet?.properties?.sheetId;
  if (sheetInternalId === undefined) {
    return false;
  }

  const existing = await client.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${table}!A2:Z`,
  });
  const rows = existing.data.values ?? [];
  const headers = TABLE_HEADERS[table];
  const idIndex = headers.findIndex((header) => header === "id");

  const matchIndex = rows.findIndex((row) => (row[idIndex] ?? "") === id);
  if (matchIndex < 0) {
    return false;
  }

  const startRowIndex = matchIndex + 1;
  await client.spreadsheets.batchUpdate({
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
  });

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
