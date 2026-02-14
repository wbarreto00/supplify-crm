import { setSessionCookie, verifyAdminPassword } from "@/lib/auth";
import { err, ok, redirectTo } from "@/lib/http";
import { loginSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await request.json().catch(() => null)
    : Object.fromEntries((await request.formData()).entries());

  const parsed = parseWithSchema(loginSchema, payload);
  if (!parsed.success) {
    return isJson
      ? err("VALIDATION_ERROR", "Invalid login payload", 422, parsed.error.flatten())
      : NextResponse.redirect(redirectTo(request.url, "/login?error=invalid"), { status: 303 });
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return isJson
      ? err("UNAUTHORIZED", "Invalid password", 401)
      : NextResponse.redirect(redirectTo(request.url, "/login?error=invalid"), { status: 303 });
  }

  if (isJson) {
    const response = ok({ loggedIn: true });
    setSessionCookie(response);
    return response;
  }

  const response = NextResponse.redirect(redirectTo(request.url, "/dashboard"), { status: 303 });
  setSessionCookie(response);
  return response;
}
