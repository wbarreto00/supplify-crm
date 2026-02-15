import { authenticateAgentRequest } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { upsertCompany } from "@/lib/repository";
import { agentCompanySchema, parseWithSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = authenticateAgentRequest(request);
  if (authError) return authError;

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(agentCompanySchema, payload);

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid company payload", 422, parsed.error.flatten());
  }

  const company = await upsertCompany({
    id: parsed.data.id || undefined,
    name: parsed.data.name,
    stage: parsed.data.stage,
    owner: parsed.data.owner,
    source: parsed.data.source,
    notes: parsed.data.notes,
  });

  return ok(company);
}
