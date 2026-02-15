import { DealStageBadge } from "@/components/badges";
import { DealStageOptions } from "@/components/forms";
import { DEAL_STAGES, STAGE_LABEL_PT } from "@/lib/constants";
import { listCompanies, listDeals } from "@/lib/repository";
import Link from "next/link";

type DealsPageProps = {
  searchParams: Promise<{ q?: string; stage?: string; view?: string }>;
};

function asCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const runtime = "nodejs";

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const { q = "", stage = "", view = "table" } = await searchParams;
  const currentView = view === "kanban" ? "kanban" : "table";
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

  const dealsByStage = new Map(DEAL_STAGES.map((item) => [item, [] as typeof filteredDeals]));
  filteredDeals.forEach((deal) => {
    dealsByStage.get(deal.stage)?.push(deal);
  });

  const tableQuery = new URLSearchParams();
  if (q) tableQuery.set("q", q);
  if (stage) tableQuery.set("stage", stage);
  tableQuery.set("view", "table");

  const kanbanQuery = new URLSearchParams();
  if (q) kanbanQuery.set("q", q);
  if (stage) kanbanQuery.set("stage", stage);
  kanbanQuery.set("view", "kanban");

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Propostas</h1>
            <p className="text-sm text-muted-foreground">Pipeline com filtros, tabela e kanban.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/deals/new"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Proposta
            </Link>
            <a
              href={`/deals?${tableQuery.toString()}`}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentView === "table" ? "bg-primary text-primary-foreground" : "border border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              Tabela
            </a>
            <a
              href={`/deals?${kanbanQuery.toString()}`}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentView === "kanban" ? "bg-primary text-primary-foreground" : "border border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              Kanban
            </a>
            <a
              href="/api/export/deals"
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Exportar CSV
            </a>
          </div>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-4" method="get">
          <input type="hidden" name="view" value={currentView} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título, empresa, dono..."
            className="rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-3"
          />
          <select name="stage" defaultValue={stage} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Todas as etapas</option>
            <DealStageOptions />
          </select>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      {currentView === "table" ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Pipeline ({filteredDeals.length})</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Título</th>
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium">Etapa</th>
                  <th className="pb-2 font-medium">Setup (BRL)</th>
                  <th className="pb-2 font-medium">Mensalidade (BRL)</th>
                  <th className="pb-2 font-medium">Total (BRL)</th>
                  <th className="pb-2 font-medium">Fechamento</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border/60">
                    <td className="py-3 text-foreground">
                      <Link href={`/deals/${deal.id}/edit?redirectTo=${encodeURIComponent(`/deals?${new URLSearchParams({ q, stage, view: currentView }).toString()}`)}`} className="hover:underline">
                        {deal.title}
                      </Link>
                    </td>
                    <td className="py-3">
                      {companiesById.has(deal.companyId) ? (
                        <Link href={`/companies/${deal.companyId}?tab=deals`} className="text-primary hover:underline">
                          {companiesById.get(deal.companyId)?.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">
                      <DealStageBadge stage={deal.stage} />
                    </td>
                    <td className="py-3">{asCurrency(deal.setupValue)}</td>
                    <td className="py-3">{asCurrency(deal.monthlyValue)}</td>
                    <td className="py-3">{asCurrency(deal.value)}</td>
                    <td className="py-3">{deal.closeDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDeals.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma proposta encontrada.</p> : null}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-lg font-semibold text-foreground">Kanban ({filteredDeals.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-max grid-flow-col gap-4">
              {DEAL_STAGES.map((stageItem) => (
                <article key={stageItem} className="w-80 rounded-lg border border-border bg-card p-3">
                  <header className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">{STAGE_LABEL_PT[stageItem]}</h3>
                    <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      {dealsByStage.get(stageItem)?.length ?? 0}
                    </span>
                  </header>
                  <div className="space-y-3">
                    {(dealsByStage.get(stageItem) ?? []).map((deal) => (
                      <Link
                        key={deal.id}
                        href={`/deals/${deal.id}/edit?redirectTo=${encodeURIComponent(`/deals?${new URLSearchParams({ q, stage, view: currentView }).toString()}`)}`}
                        className="block rounded-md border border-border bg-background p-3 hover:border-primary/40 hover:bg-secondary/40"
                      >
                        <p className="text-sm font-semibold text-foreground">{deal.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{companiesById.get(deal.companyId)?.name || "Sem empresa"}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-foreground/80">
                          <div className="rounded bg-card px-2 py-1">Setup: {asCurrency(deal.setupValue)}</div>
                          <div className="rounded bg-card px-2 py-1">Mensal: {asCurrency(deal.monthlyValue)}</div>
                        </div>
                      </Link>
                    ))}
                    {(dealsByStage.get(stageItem)?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem propostas nesta coluna.</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
