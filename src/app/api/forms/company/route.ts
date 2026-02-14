import { requireApiSession } from "@/lib/auth";
import { appendError, formDataToObject, safeRedirectPath } from "@/lib/form-utils";
import { redirectTo } from "@/lib/http";
import { deleteCompany, upsertCompany } from "@/lib/repository";
import { companyInputSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = requireApiSession(request);
  if (authError) return authError;

  const formData = await request.formData();
  const payload = formDataToObject(formData);
  const action = String(formData.get("action") ?? "");
  const redirectPath = safeRedirectPath(formData.get("redirectTo"), "/companies");

  if (action === "delete") {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "missing-id")), {
        status: 303,
      });
    }
    await deleteCompany(id);
    return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
  }

  const parsed = parseWithSchema(companyInputSchema, payload);
  if (!parsed.success) {
    return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "validation")), { status: 303 });
  }

  const id = String(formData.get("id") ?? "").trim();

  await upsertCompany({
    id: action === "update" ? id : undefined,
    name: parsed.data.name,
    segment: parsed.data.segment,
    size: parsed.data.size,
    owner: parsed.data.owner,
    status: parsed.data.status,
    source: parsed.data.source,
    notes: parsed.data.notes,
  });

  return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
}
