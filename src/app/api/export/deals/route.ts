import { requireApiSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { TABLE_HEADERS } from "@/lib/constants";
import { listDeals } from "@/lib/repository";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = requireApiSession(request);
  if (authError) return authError;

  const deals = await listDeals();
  const csv = toCsv(deals, [...TABLE_HEADERS.deals]);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="deals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
