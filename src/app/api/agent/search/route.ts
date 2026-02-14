import { authenticateAgentRequest } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { searchAgent } from "@/lib/repository";
import { agentSearchSchema, parseWithSchema } from "@/lib/validation";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = authenticateAgentRequest(request);
  if (authError) return authError;

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const parsed = parseWithSchema(agentSearchSchema, { q: query });

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid search query", 422, parsed.error.flatten());
  }

  const results = await searchAgent(parsed.data.q);
  return ok(results);
}
