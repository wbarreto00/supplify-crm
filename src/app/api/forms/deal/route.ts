import { requireApiSession } from "@/lib/auth";
import { appendError, formDataToObject, safeRedirectPath } from "@/lib/form-utils";
import { redirectTo } from "@/lib/http";
import { deleteDeal, upsertDeal } from "@/lib/repository";
import { dealInputSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authError = requireApiSession(request);
  if (authError) return authError;

  const formData = await request.formData();
  const payload = formDataToObject(formData);
  const action = String(formData.get("action") ?? "");
  const redirectPath = safeRedirectPath(formData.get("redirectTo"), "/deals");

  if (action === "delete") {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "missing-id")), {
        status: 303,
      });
    }
    await deleteDeal(id);
    return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
  }

  const parsed = parseWithSchema(dealInputSchema, payload);
  if (!parsed.success) {
    return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "validation")), { status: 303 });
  }

  const id = String(formData.get("id") ?? "").trim();

  await upsertDeal({
    id: action === "update" ? id : undefined,
    companyId: parsed.data.companyId,
    title: parsed.data.title,
    stage: parsed.data.stage,
    value: parsed.data.value,
    probability: parsed.data.probability,
    closeDate: parsed.data.closeDate,
    owner: parsed.data.owner,
    notes: parsed.data.notes,
  });

  return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
}
