const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_SESSION_SECRET = "change-me-super-secret";
const DEFAULT_AGENT_API_KEY = "dev-agent-key";

function normalizeEnv(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim();
}

export function getAdminPassword(): string {
  return normalizeEnv(process.env.ADMIN_PASSWORD) ?? DEFAULT_ADMIN_PASSWORD;
}

export function getSessionSecret(): string {
  return normalizeEnv(process.env.SESSION_SECRET) ?? DEFAULT_SESSION_SECRET;
}

export function getAgentApiKey(): string {
  return normalizeEnv(process.env.AGENT_API_KEY) ?? DEFAULT_AGENT_API_KEY;
}

export function getGoogleSheetConfig() {
  const sheetId = normalizeEnv(process.env.GOOGLE_SHEET_ID);
  const clientEmail = normalizeEnv(process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  const rawPrivateKey = normalizeEnv(process.env.GOOGLE_SHEETS_PRIVATE_KEY);

  if (!sheetId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  return {
    sheetId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
  };
}
