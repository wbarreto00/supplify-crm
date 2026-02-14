import { requireApiSession } from "@/lib/auth";
import { appendError, formDataToObject, safeRedirectPath } from "@/lib/form-utils";
import { redirectTo } from "@/lib/http";
import { deleteContact, upsertContact } from "@/lib/repository";
import { contactInputSchema, parseWithSchema } from "@/lib/validation";
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
    await deleteContact(id);
    return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
  }

  const parsed = parseWithSchema(contactInputSchema, payload);
  if (!parsed.success) {
    return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "validation")), { status: 303 });
  }

  const id = String(formData.get("id") ?? "").trim();

  await upsertContact({
    id: action === "update" ? id : undefined,
    companyId: parsed.data.companyId,
    name: parsed.data.name,
    role: parsed.data.role,
    email: parsed.data.email,
    phone: parsed.data.phone,
    linkedin: parsed.data.linkedin,
    notes: parsed.data.notes,
  });

  return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
}
