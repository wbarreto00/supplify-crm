import { authenticateAgentRequest } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { findCompanyByName, upsertCompany, upsertContact } from "@/lib/repository";
import { agentContactSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = authenticateAgentRequest(request);
  if (authError) return authError;

  const payload = await request.json().catch(() => null);
  const parsed = parseWithSchema(agentContactSchema, payload);

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid contact payload", 422, parsed.error.flatten());
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

  const contact = await upsertContact({
    id: parsed.data.id || undefined,
    companyId,
    name: parsed.data.name,
    role: parsed.data.role,
    email: parsed.data.email,
    phone: parsed.data.phone,
    linkedin: parsed.data.linkedin,
    notes: parsed.data.notes,
  });

  return ok(contact);
}
