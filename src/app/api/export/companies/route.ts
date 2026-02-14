import { requireApiSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { TABLE_HEADERS } from "@/lib/constants";
import { listCompanies } from "@/lib/repository";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = requireApiSession(request);
  if (authError) return authError;

  const companies = await listCompanies();
  const csv = toCsv(companies, [...TABLE_HEADERS.companies]);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="companies-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
