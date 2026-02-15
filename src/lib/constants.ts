export const TABLE_HEADERS = {
  companies: [
    "id",
    "name",
    "stage",
    "owner",
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

export const DEAL_STAGES = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export const COMPANY_SOURCES = [
  "Linkedin",
  "Snov.io",
  "Prospectfy",
  "Indicação",
  "Meetup",
  "Evento",
  "Site",
  "Inbound",
] as const;

export const STAGE_LABEL_PT: Record<(typeof DEAL_STAGES)[number], string> = {
  new: "Novo",
  qualified: "Qualificado",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Ganho",
  lost: "Perdido",
};
// Activities also represent communications with leads.
export const ACTIVITY_TYPES = [
  "call",
  "email",
  "linkedin",
  "whatsapp",
  "meeting",
  "task",
] as const;

export const ACTIVITY_TYPE_LABEL_PT: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  call: "Ligação",
  email: "E-mail",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  meeting: "Reunião",
  task: "Tarefa",
};

export const SESSION_COOKIE_NAME = "supplify_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
