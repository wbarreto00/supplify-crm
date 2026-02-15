import { authenticateAgentRequest } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { findCompanyByName, upsertCompany, upsertDeal } from "@/lib/repository";
import { agentDealSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = authenticateAgentRequest(request);
  if (authError) return authError;

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(agentDealSchema, payload);

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid deal payload", 422, parsed.error.flatten());
  }

  let companyId = parsed.data.companyId;

  if (!companyId && parsed.data.companyName) {
    const existingCompany = await findCompanyByName(parsed.data.companyName);
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const createdCompany = await upsertCompany({
        name: parsed.data.companyName,
        stage: "new",
        owner: "",
        source: "Inbound",
        notes: "",
      });
      companyId = createdCompany.id;
    }
  }

  if (!companyId) {
    return err("VALIDATION_ERROR", "companyId could not be resolved", 422);
  }

  const deal = await upsertDeal({
    id: parsed.data.id || undefined,
    companyId,
    title: parsed.data.title,
    stage: parsed.data.stage,
    value: parsed.data.value,
    setupValue: parsed.data.setupValue,
    monthlyValue: parsed.data.monthlyValue,
    probability: parsed.data.probability,
    closeDate: parsed.data.closeDate,
    owner: parsed.data.owner,
    notes: parsed.data.notes,
  });

  return ok(deal);
}
