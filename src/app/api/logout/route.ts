import { clearSessionCookie } from "@/lib/auth";
import { redirectTo } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(redirectTo(request.url, "/login"), { status: 303 });
  clearSessionCookie(response);
  return response;
}
