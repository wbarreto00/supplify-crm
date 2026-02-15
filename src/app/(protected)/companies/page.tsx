import { DealStageBadge } from "@/components/badges";
import { CompanyStageOptions } from "@/components/forms";
import { DEAL_STAGES } from "@/lib/constants";
import { listCompanies, listDeals } from "@/lib/repository";
import Link from "next/link";

type CompaniesPageProps = {
  searchParams: Promise<{ q?: string; stage?: string; view?: string }>;
};

export const runtime = "nodejs";

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const { q = "", stage = "", view = "kanban" } = await searchParams;
  const currentView = view === "table" ? "table" : "kanban";
  const [companies, deals] = await Promise.all([listCompanies(), listDeals()]);
  const normalizedQuery = q.trim().toLowerCase();

  const filtered = companies.filter((company) => {
    const queryMatch =
      normalizedQuery.length === 0 ||
      [company.name, company.owner, company.source, company.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const stageMatch = stage ? company.stage === stage : true;
    return queryMatch && stageMatch;
  });

  const dealsByCompanyId = new Map<string, typeof deals>();
  for (const deal of deals) {
    const list = dealsByCompanyId.get(deal.companyId) ?? [];
    list.push(deal);
    dealsByCompanyId.set(deal.companyId, list);
  }

  function asCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  const byStage = new Map(DEAL_STAGES.map((s) => [s, [] as typeof filtered]));
  for (const company of filtered) {
    byStage.get(company.stage)?.push(company);
  }

  const baseQuery = new URLSearchParams();
  if (q) baseQuery.set("q", q);
  if (stage) baseQuery.set("stage", stage);

  const kanbanQuery = new URLSearchParams(baseQuery);
  kanbanQuery.set("view", "kanban");
  const tableQuery = new URLSearchParams(baseQuery);
  tableQuery.set("view", "table");

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground">Kanban por etapa (padrão) e opção de lista.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/companies/new"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Empresa
            </Link>
            <a
              href={`/companies?${kanbanQuery.toString()}`}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentView === "kanban" ? "bg-primary text-primary-foreground" : "border border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              Kanban
            </a>
            <a
              href={`/companies?${tableQuery.toString()}`}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentView === "table" ? "bg-primary text-primary-foreground" : "border border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              Lista
            </a>
            <a
              href="/api/export/companies"
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
            placeholder="Buscar por nome, dono, origem..."
            className="rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-3"
          />
          <select name="stage" defaultValue={stage} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Todas as etapas</option>
            <CompanyStageOptions />
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
          <h2 className="text-lg font-semibold text-foreground">Lista ({filtered.length})</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium">Dono</th>
                  <th className="pb-2 font-medium">Etapa</th>
                  <th className="pb-2 font-medium">Setup (BRL)</th>
                  <th className="pb-2 font-medium">Mensalidade (BRL)</th>
                  <th className="pb-2 font-medium">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => {
                  const companyDeals = dealsByCompanyId.get(company.id) ?? [];
                  const latest = [...companyDeals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
                  return (
                    <tr key={company.id} className="border-b border-border/60">
                      <td className="py-3">
                        <Link href={`/companies/${company.id}`} className="font-medium text-primary hover:underline">
                          {company.name}
                        </Link>
                      </td>
                      <td className="py-3 text-foreground/80">{company.owner || "-"}</td>
                      <td className="py-3">
                        <DealStageBadge stage={company.stage} />
                      </td>
                      <td className="py-3">{asCurrency(latest?.setupValue ?? 0)}</td>
                      <td className="py-3">{asCurrency(latest?.monthlyValue ?? 0)}</td>
                      <td className="py-3 text-foreground/80">{new Date(company.updatedAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma empresa encontrada.</p> : null}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-lg font-semibold text-foreground">Kanban ({filtered.length})</h2>
          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-max grid-flow-col gap-4">
              {DEAL_STAGES.map((stageItem) => (
                <article key={stageItem} className="w-80 rounded-lg border border-border bg-card p-3">
                  <header className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <DealStageBadge stage={stageItem} />
                    </div>
                    <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                      {byStage.get(stageItem)?.length ?? 0}
                    </span>
                  </header>
                  <div className="space-y-3">
                    {(byStage.get(stageItem) ?? []).map((company) => {
                      const companyDeals = dealsByCompanyId.get(company.id) ?? [];
                      const latest = [...companyDeals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
                      return (
                        <Link
                          key={company.id}
                          href={`/companies/${company.id}`}
                          className="block rounded-md border border-border bg-background p-3 hover:border-primary/40 hover:bg-secondary/40"
                        >
                          <p className="text-sm font-semibold text-foreground">{company.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {company.owner ? `Dono: ${company.owner}` : "Sem dono"} {company.source ? `| Origem: ${company.source}` : ""}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-foreground/80">
                            <div className="rounded bg-card px-2 py-1">Setup: {asCurrency(latest?.setupValue ?? 0)}</div>
                            <div className="rounded bg-card px-2 py-1">Mensal: {asCurrency(latest?.monthlyValue ?? 0)}</div>
                          </div>
                        </Link>
                      );
                    })}
                    {(byStage.get(stageItem)?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem empresas nesta coluna.</p>
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
