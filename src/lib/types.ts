import { ACTIVITY_TYPES, DEAL_STAGES, type TableName } from "@/lib/constants";

export type DealStage = (typeof DEAL_STAGES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Company {
  id: string;
  name: string;
  stage: DealStage;
  owner: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  companyId: string;
  title: string;
  stage: DealStage;
  value: number;
  setupValue: number;
  monthlyValue: number;
  probability: number;
  closeDate: string;
  owner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  companyId: string;
  contactId: string;
  type: ActivityType;
  dueDate: string;
  done: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type Entity = Company | Contact | Deal | Activity;

// Generic parameter is kept for call-site compatibility (TableRecord<T>).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TableRecord<T extends TableName = TableName> = Record<string, string>;

export interface AgentResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
