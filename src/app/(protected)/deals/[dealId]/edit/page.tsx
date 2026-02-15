import { DealStageOptions } from "@/components/forms";
import { listCompanies, listDeals } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type EditDealPageProps = {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
};

export const runtime = "nodejs";

export default async function EditDealPage({ params, searchParams }: EditDealPageProps) {
  const { dealId } = await params;
  const { redirectTo = "/deals" } = await searchParams;

  const [deals, companies] = await Promise.all([listDeals(), listCompanies()]);
  const deal = deals.find((item) => item.id === dealId) ?? null;
  if (!deal) notFound();

  const company = companies.find((c) => c.id === deal.companyId) ?? null;

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Deal</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{deal.title}</h1>
            <p className="text-sm text-slate-600">{company?.name || "Sem company"}</p>
          </div>
          <div className="flex items-center gap-2">
            {company ? (
              <Link
                href={`/companies/${company.id}?tab=deals`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Ver company
              </Link>
            ) : null}
            <Link
              href={redirectTo}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action="/api/forms/deal" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="id" value={deal.id} />
          <input type="hidden" name="companyId" value={deal.companyId} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <label className="text-sm text-slate-700">
            Título
            <input
              name="title"
              defaultValue={deal.title}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Stage
            <select
              name="stage"
              defaultValue={deal.stage}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <DealStageOptions />
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Valor total
            <input
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.value}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Setup
            <input
              name="setupValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.setupValue}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Mensalidade
            <input
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.monthlyValue}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Probabilidade (%)
            <input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue={deal.probability}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Fechamento
            <input
              name="closeDate"
              type="date"
              defaultValue={deal.closeDate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Owner
            <input
              name="owner"
              defaultValue={deal.owner}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Notas
            <textarea
              name="notes"
              defaultValue={deal.notes}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Salvar
            </button>
            <Link
              href={redirectTo}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-rose-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Excluir</h2>
        <form action="/api/forms/deal" method="post" className="mt-4">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={deal.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            Excluir deal
          </button>
        </form>
      </section>
    </div>
  );
}

