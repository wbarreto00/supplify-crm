import { DealStageBadge } from "@/components/badges";
import { DealStageOptions } from "@/components/forms";
import { DEAL_STAGES } from "@/lib/constants";
import { listCompanies, listDeals } from "@/lib/repository";
import Link from "next/link";

type DealsPageProps = {
  searchParams: Promise<{ q?: string; stage?: string }>;
};

function asCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const runtime = "nodejs";

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const { q = "", stage = "" } = await searchParams;
  const [companies, deals] = await Promise.all([listCompanies(), listDeals()]);
  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const normalizedQuery = q.trim().toLowerCase();

  const filteredDeals = deals.filter((deal) => {
    const companyName = companiesById.get(deal.companyId)?.name ?? "";
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [deal.title, deal.owner, deal.notes, companyName].join(" ").toLowerCase().includes(normalizedQuery);
    const matchesStage = stage ? deal.stage === stage : true;
    return matchesQuery && matchesStage;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Deals</h1>
            <p className="text-sm text-slate-600">Pipeline com filtros e cadastro rápido.</p>
          </div>
          <a
            href="/api/export/deals"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Exportar CSV
          </a>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-4" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título, company, owner..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-3"
          />
          <select name="stage" defaultValue={stage} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos os stages</option>
            <DealStageOptions />
          </select>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Novo deal</h2>
        <form action="/api/forms/deal" method="post" className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="redirectTo" value="/deals" />

          <label className="text-sm text-slate-700">
            Company
            <select name="companyId" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Título
            <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Stage
            <select name="stage" defaultValue="new" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {DEAL_STAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Valor
            <input name="value" type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Probabilidade (%)
            <input name="probability" type="number" min="0" max="100" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Fechamento
            <input name="closeDate" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Owner
            <input name="owner" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Notas
            <textarea name="notes" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Criar deal
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Pipeline ({filteredDeals.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Título</th>
                <th className="pb-2 font-medium">Company</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Valor</th>
                <th className="pb-2 font-medium">Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-slate-100">
                  <td className="py-3 text-slate-900">{deal.title}</td>
                  <td className="py-3">
                    {companiesById.has(deal.companyId) ? (
                      <Link href={`/companies/${deal.companyId}?tab=deals`} className="text-sky-700 hover:underline">
                        {companiesById.get(deal.companyId)?.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3">
                    <DealStageBadge stage={deal.stage} />
                  </td>
                  <td className="py-3">{asCurrency(deal.value)}</td>
                  <td className="py-3">{deal.closeDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDeals.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhum deal encontrado.</p> : null}
        </div>
      </section>
    </div>
  );
}
