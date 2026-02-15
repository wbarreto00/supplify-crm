import fs from "node:fs";
import path from "node:path";

type ImportDeal = {
  snovDealId: number;
  companyName: string;
  contactName?: string;
  participantNames?: string;
};

type SnovDealPeople = {
  prospectId?: number;
  name?: string;
};

type SnovDealDetail = {
  data?: {
    id: number;
    people?: SnovDealPeople | null;
    participantPeoples?: SnovDealPeople[] | null;
  };
};

type ContactOut = {
  companyName: string;
  prospectId: number;
  name: string;
  email: string;
  linkedin: string;
  phone: string;
  notes: string;
};

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index);
    const value = line.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing env ${key}`);
  }
  return value.trim();
}

function splitNames(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function snovGetJson<T>(url: string, cookie: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
      cookie,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Snov GET ${url} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function fetchEmails(cookie: string, ids: number[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const batch of chunk(ids, 10)) {
    const qs = batch.map((id) => `prospectIds[]=${encodeURIComponent(String(id))}`).join("&");
    const url = `https://app.snov.io/back/prospects/emails?${qs}`;
    const res = await snovGetJson<{ success?: boolean; data?: Record<string, string[]> }>(url, cookie);
    Object.assign(out, res.data ?? {});
  }
  return out;
}

async function fetchLinkedin(cookie: string, ids: number[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const batch of chunk(ids, 10)) {
    const qs = batch.map((id) => `prospectIds[]=${encodeURIComponent(String(id))}`).join("&");
    const url = `https://app.snov.io/back/prospects/linkedin-urls?${qs}`;
    const res = await snovGetJson<{ success?: boolean; data?: Record<string, string[]> }>(url, cookie);
    Object.assign(out, res.data ?? {});
  }
  return out;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadEnvFile(path.join(repoRoot, ".env.local"));

  // We intentionally keep this as a single cookie header string so we don't need to understand auth internals.
  // Example: "token=...; selector=...; snov_io=...; userId=...; st_ua=..."
  const snovCookie = requiredEnv("SNOV_COOKIE");

  const payloadPath = path.join(repoRoot, "data", "snov_import_payload.json");
  const deals = JSON.parse(fs.readFileSync(payloadPath, "utf8")) as ImportDeal[];

  const prospectRefs: Array<{ companyName: string; dealId: number; prospectId: number; name: string }> = [];

  for (const item of deals) {
    const detail = await snovGetJson<SnovDealDetail>(`https://app.snov.io/crm/api/deals/${item.snovDealId}`, snovCookie);
    const primary = detail.data?.people ?? null;
    const participants = detail.data?.participantPeoples ?? [];

    const candidateNames = new Set<string>();
    if (item.contactName) candidateNames.add(item.contactName.trim());
    splitNames(item.participantNames).forEach((name) => candidateNames.add(name));

    const addPerson = (person: SnovDealPeople | null) => {
      if (!person?.prospectId) return;
      const name = (person.name ?? "").trim() || [...candidateNames][0] || `Prospect ${person.prospectId}`;
      prospectRefs.push({ companyName: item.companyName, dealId: item.snovDealId, prospectId: person.prospectId, name });
    };

    addPerson(primary);
    participants.forEach((p) => addPerson(p));

    // If Snov doesn't expose prospects for a deal (rare), fallback to names only without prospectId.
    // We skip these in extraction because we can't enrich with emails/linkedin.
  }

  const uniqueByCompanyProspect = new Map<string, { companyName: string; prospectId: number; name: string; dealId: number }>();
  for (const ref of prospectRefs) {
    const key = `${ref.companyName.toLowerCase()}::${ref.prospectId}`;
    if (!uniqueByCompanyProspect.has(key)) {
      uniqueByCompanyProspect.set(key, ref);
    }
  }

  const uniqueProspectIds = Array.from(new Set(Array.from(uniqueByCompanyProspect.values()).map((r) => r.prospectId)));
  const [emailsById, linkedinById] = await Promise.all([
    fetchEmails(snovCookie, uniqueProspectIds),
    fetchLinkedin(snovCookie, uniqueProspectIds),
  ]);

  const contacts: ContactOut[] = [];
  for (const ref of uniqueByCompanyProspect.values()) {
    const emails = emailsById[String(ref.prospectId)] ?? [];
    const linkedins = linkedinById[String(ref.prospectId)] ?? [];
    contacts.push({
      companyName: ref.companyName,
      prospectId: ref.prospectId,
      name: ref.name,
      email: emails[0] ?? "",
      linkedin: linkedins[0] ?? "",
      phone: "",
      notes: `Imported from Snov.io | dealId=${ref.dealId} | prospectId=${ref.prospectId}`,
    });
  }

  const outPath = path.join(repoRoot, "data", "snov_contacts_payload.json");
  fs.writeFileSync(outPath, JSON.stringify(contacts, null, 2));
  console.log(`WROTE ${outPath} contacts=${contacts.length} uniqueProspects=${uniqueProspectIds.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
