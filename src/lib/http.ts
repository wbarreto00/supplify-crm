import type { AgentResponse } from "@/lib/types";
import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<AgentResponse<T>>({ ok: true, data }, { status });
}

export function err(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json<AgentResponse>({ ok: false, error: { code, message, details } }, { status });
}

export function redirectTo(requestUrl: string, path: string) {
  return new URL(path, requestUrl);
}
