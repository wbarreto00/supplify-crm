import type { Activity, Company, Contact, Deal } from "@/lib/types";
import { list, remove, search as searchTable, upsert } from "@/lib/sheets";
import { clamp, createId, normalizeEmail, normalizeKey, nowIso } from "@/lib/normalization";

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBoolean(value: string): boolean {
  return value === "true";
}

function toCompany(record: Record<string, string>): Company {
  return {
    id: record.id,
    name: record.name,
    segment: record.segment,
    size: record.size,
    owner: record.owner,
    status: (record.status as Company["status"]) || "lead",
    source: record.source,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toContact(record: Record<string, string>): Contact {
  return {
    id: record.id,
    companyId: record.companyId,
    name: record.name,
    role: record.role,
    email: record.email,
    phone: record.phone,
    linkedin: record.linkedin,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toDeal(record: Record<string, string>): Deal {
  return {
    id: record.id,
    companyId: record.companyId,
    title: record.title,
    stage: (record.stage as Deal["stage"]) || "new",
    value: parseNumber(record.value),
    probability: clamp(parseNumber(record.probability), 0, 100),
    closeDate: record.closeDate,
    owner: record.owner,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toActivity(record: Record<string, string>): Activity {
  return {
    id: record.id,
    companyId: record.companyId,
    contactId: record.contactId,
    type: (record.type as Activity["type"]) || "task",
    dueDate: record.dueDate,
    done: parseBoolean(record.done),
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function sortByUpdatedAtDesc<T extends { updatedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listCompanies(): Promise<Company[]> {
  const rows = await list("companies");
  return sortByUpdatedAtDesc(rows.map((row) => toCompany(row as Record<string, string>)));
}

export async function listContacts(): Promise<Contact[]> {
  const rows = await list("contacts");
  return sortByUpdatedAtDesc(rows.map((row) => toContact(row as Record<string, string>)));
}

export async function listDeals(): Promise<Deal[]> {
  const rows = await list("deals");
  return sortByUpdatedAtDesc(rows.map((row) => toDeal(row as Record<string, string>)));
}

export async function listActivities(): Promise<Activity[]> {
  const rows = await list("activities");
  return sortByUpdatedAtDesc(rows.map((row) => toActivity(row as Record<string, string>)));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const companies = await listCompanies();
  return companies.find((item) => item.id === id) ?? null;
}

export async function getContactsByCompanyId(companyId: string): Promise<Contact[]> {
  const contacts = await listContacts();
  return contacts.filter((item) => item.companyId === companyId);
}

export async function getDealsByCompanyId(companyId: string): Promise<Deal[]> {
  const deals = await listDeals();
  return deals.filter((item) => item.companyId === companyId);
}

export async function getActivitiesByCompanyId(companyId: string): Promise<Activity[]> {
  const activities = await listActivities();
  return activities.filter((item) => item.companyId === companyId);
}

export async function findCompanyByName(name: string): Promise<Company | null> {
  const needle = normalizeKey(name);
  const companies = await listCompanies();
  return companies.find((item) => normalizeKey(item.name) === needle) ?? null;
}

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const needle = normalizeEmail(email);
  const contacts = await listContacts();
  return contacts.find((item) => normalizeEmail(item.email) === needle) ?? null;
}

export async function findDealByCompanyAndTitle(companyId: string, title: string): Promise<Deal | null> {
  const needle = normalizeKey(title);
  const deals = await getDealsByCompanyId(companyId);
  return deals.find((item) => normalizeKey(item.title) === needle) ?? null;
}

export async function upsertCompany(input: Omit<Company, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = nowIso();
  const existing = input.id ? await getCompanyById(input.id) : await findCompanyByName(input.name);

  const company: Company = {
    id: existing?.id ?? input.id ?? createId("cmp"),
    name: input.name,
    segment: input.segment,
    size: input.size,
    owner: input.owner,
    status: input.status,
    source: input.source,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await upsert(
    "companies",
    {
      id: company.id,
      name: company.name,
      segment: company.segment,
      size: company.size,
      owner: company.owner,
      status: company.status,
      source: company.source,
      notes: company.notes,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    },
    ["id"],
  );

  return company;
}

export async function upsertContact(input: Omit<Contact, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = nowIso();
  const existing =
    input.id
      ? (await listContacts()).find((item) => item.id === input.id) ?? null
      : input.email
        ? await findContactByEmail(input.email)
        : null;

  const contact: Contact = {
    id: existing?.id ?? input.id ?? createId("ctc"),
    companyId: input.companyId,
    name: input.name,
    role: input.role,
    email: normalizeEmail(input.email),
    phone: input.phone,
    linkedin: input.linkedin,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await upsert(
    "contacts",
    {
      id: contact.id,
      companyId: contact.companyId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      linkedin: contact.linkedin,
      notes: contact.notes,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    },
    ["id"],
  );

  return contact;
}

export async function upsertDeal(input: Omit<Deal, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = nowIso();
  const existing =
    input.id
      ? (await listDeals()).find((item) => item.id === input.id) ?? null
      : await findDealByCompanyAndTitle(input.companyId, input.title);

  const deal: Deal = {
    id: existing?.id ?? input.id ?? createId("deal"),
    companyId: input.companyId,
    title: input.title,
    stage: input.stage,
    value: Math.max(0, input.value),
    probability: clamp(input.probability, 0, 100),
    closeDate: input.closeDate,
    owner: input.owner,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await upsert(
    "deals",
    {
      id: deal.id,
      companyId: deal.companyId,
      title: deal.title,
      stage: deal.stage,
      value: String(deal.value),
      probability: String(deal.probability),
      closeDate: deal.closeDate,
      owner: deal.owner,
      notes: deal.notes,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    },
    ["id"],
  );

  return deal;
}

export async function createActivity(input: Omit<Activity, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = nowIso();
  const activity: Activity = {
    id: input.id ?? createId("act"),
    companyId: input.companyId,
    contactId: input.contactId,
    type: input.type,
    dueDate: input.dueDate,
    done: input.done,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  await upsert(
    "activities",
    {
      id: activity.id,
      companyId: activity.companyId,
      contactId: activity.contactId,
      type: activity.type,
      dueDate: activity.dueDate,
      done: String(activity.done),
      notes: activity.notes,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    },
    ["id"],
  );

  return activity;
}

export async function upsertActivity(input: Omit<Activity, "createdAt" | "updatedAt">) {
  const existing = (await listActivities()).find((item) => item.id === input.id);
  const now = nowIso();
  const activity: Activity = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await upsert(
    "activities",
    {
      id: activity.id,
      companyId: activity.companyId,
      contactId: activity.contactId,
      type: activity.type,
      dueDate: activity.dueDate,
      done: String(activity.done),
      notes: activity.notes,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    },
    ["id"],
  );

  return activity;
}

export async function deleteCompany(id: string): Promise<void> {
  await remove("companies", id);

  const contacts = await getContactsByCompanyId(id);
  const deals = await getDealsByCompanyId(id);
  const activities = await getActivitiesByCompanyId(id);

  await Promise.all([
    ...contacts.map((contact) => remove("contacts", contact.id)),
    ...deals.map((deal) => remove("deals", deal.id)),
    ...activities.map((activity) => remove("activities", activity.id)),
  ]);
}

export async function deleteContact(id: string): Promise<void> {
  await remove("contacts", id);
}

export async function deleteDeal(id: string): Promise<void> {
  await remove("deals", id);
}

export async function deleteActivity(id: string): Promise<void> {
  await remove("activities", id);
}

export async function searchAgent(query: string) {
  const [companies, contacts, deals] = await Promise.all([
    searchTable("companies", query),
    searchTable("contacts", query),
    searchTable("deals", query),
  ]);

  return {
    companies: companies.map((row) => toCompany(row as Record<string, string>)),
    contacts: contacts.map((row) => toContact(row as Record<string, string>)),
    deals: deals.map((row) => toDeal(row as Record<string, string>)),
  };
}
