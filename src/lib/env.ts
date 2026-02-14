const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_SESSION_SECRET = "change-me-super-secret";
const DEFAULT_AGENT_API_KEY = "dev-agent-key";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET;
}

export function getAgentApiKey(): string {
  return process.env.AGENT_API_KEY ?? DEFAULT_AGENT_API_KEY;
}

export function getGoogleSheetConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  return {
    sheetId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
  };
}
