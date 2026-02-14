import { authenticateAgentRequest } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { createActivity, findCompanyByName, upsertCompany } from "@/lib/repository";
import { agentActivitySchema, parseWithSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = authenticateAgentRequest(request);
  if (authError) return authError;

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(agentActivitySchema, payload);

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid activity payload", 422, parsed.error.flatten());
  }

  let companyId = parsed.data.companyId;

  if (!companyId && parsed.data.companyName) {
    const existingCompany = await findCompanyByName(parsed.data.companyName);
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const createdCompany = await upsertCompany({
        name: parsed.data.companyName,
        segment: "",
        size: "",
        owner: "",
        status: "lead",
        source: "agent",
        notes: "",
      });
      companyId = createdCompany.id;
    }
  }

  if (!companyId) {
    return err("VALIDATION_ERROR", "companyId could not be resolved", 422);
  }

  const activity = await createActivity({
    companyId,
    contactId: parsed.data.contactId,
    type: parsed.data.type,
    dueDate: parsed.data.dueDate,
    done: parsed.data.done,
    notes: parsed.data.notes,
  });

  return ok(activity, 201);
}
