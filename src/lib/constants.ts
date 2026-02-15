export const TABLE_HEADERS = {
  companies: [
    "id",
    "name",
    "segment",
    "size",
    "owner",
    "status",
    "source",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  contacts: [
    "id",
    "companyId",
    "name",
    "role",
    "email",
    "phone",
    "linkedin",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  deals: [
    "id",
    "companyId",
    "title",
    "stage",
    "value",
    "setupValue",
    "monthlyValue",
    "probability",
    "closeDate",
    "owner",
    "notes",
    "createdAt",
    "updatedAt",
  ],
  activities: [
    "id",
    "companyId",
    "contactId",
    "type",
    "dueDate",
    "done",
    "notes",
    "createdAt",
    "updatedAt",
  ],
} as const;

export type TableName = keyof typeof TABLE_HEADERS;

export const COMPANY_STATUSES = ["lead", "prospect", "active", "lost"] as const;
export const DEAL_STAGES = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
// Activities also represent communications with leads.
export const ACTIVITY_TYPES = [
  "call",
  "email",
  "linkedin",
  "whatsapp",
  "meeting",
  "task",
] as const;

export const SESSION_COOKIE_NAME = "supplify_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
