import { requireApiSession } from "@/lib/auth";
import { appendError, formDataToObject, safeRedirectPath } from "@/lib/form-utils";
import { redirectTo } from "@/lib/http";
import { createActivity, deleteActivity, upsertActivity } from "@/lib/repository";
import { activityInputSchema, parseWithSchema } from "@/lib/validation";
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
    await deleteActivity(id);
    return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
  }

  const parsed = parseWithSchema(activityInputSchema, payload);
  if (!parsed.success) {
    return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "validation")), { status: 303 });
  }

  const id = String(formData.get("id") ?? "").trim();

  if (action === "update") {
    if (!id) {
      return NextResponse.redirect(redirectTo(request.url, appendError(redirectPath, "missing-id")), {
        status: 303,
      });
    }

    await upsertActivity({
      id,
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId,
      type: parsed.data.type,
      dueDate: parsed.data.dueDate,
      done: parsed.data.done,
      notes: parsed.data.notes,
    });
  } else {
    await createActivity({
      companyId: parsed.data.companyId,
      contactId: parsed.data.contactId,
      type: parsed.data.type,
      dueDate: parsed.data.dueDate,
      done: parsed.data.done,
      notes: parsed.data.notes,
    });
  }

  return NextResponse.redirect(redirectTo(request.url, redirectPath), { status: 303 });
}
