import { ActivityTypeBadge } from "@/components/badges";
import { BarChart, Sparkline } from "@/components/charts";
import { DEAL_STAGES, STAGE_LABEL_PT } from "@/lib/constants";
import { listActivities, listCompanies, listDeals } from "@/lib/repository";

function asCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export const runtime = "nodejs";

export default async function DashboardPage() {
  const [companies, deals, activities] = await Promise.all([
    listCompanies(),
    listDeals(),
    listActivities(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingActivities = activities
    .filter((activity) => !activity.done && activity.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  const companiesByStage = Object.fromEntries(
    DEAL_STAGES.map((stage) => [stage, companies.filter((c) => c.stage === stage).length]),
  ) as Record<(typeof DEAL_STAGES)[number], number>;

  const dealsByStage = Object.fromEntries(
    DEAL_STAGES.map((stage) => [stage, deals.filter((d) => d.stage === stage).length]),
  ) as Record<(typeof DEAL_STAGES)[number], number>;

  const proposals = deals.filter((deal) => deal.stage === "proposal");
  const proposalCount = proposals.length;
  const proposalTotalValue = proposals.reduce((sum, deal) => sum + deal.value, 0);
  const proposalTotalSetup = proposals.reduce((sum, deal) => sum + deal.setupValue, 0);
  const proposalTotalMonthly = proposals.reduce((sum, deal) => sum + deal.monthlyValue, 0);

  const proposalAvgSetup = proposalCount > 0 ? proposalTotalSetup / proposalCount : 0;
  const proposalAvgMonthly = proposalCount > 0 ? proposalTotalMonthly / proposalCount : 0;

  const companiesStageData = DEAL_STAGES.map((s) => ({
    label: STAGE_LABEL_PT[s],
    value: companiesByStage[s],
  }));
  const dealsStageData = DEAL_STAGES.map((s) => ({
    label: STAGE_LABEL_PT[s],
    value: dealsByStage[s],
  }));

  // Trend: proposal count by month (last 8 months).
  const monthKey = (iso: string) => (iso ? iso.slice(0, 7) : "");
  const now = new Date();
  const months: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const proposalsByMonth = new Map(months.map((m) => [m, 0]));
  for (const deal of proposals) {
    const k = monthKey(deal.createdAt || deal.updatedAt);
    if (proposalsByMonth.has(k)) proposalsByMonth.set(k, (proposalsByMonth.get(k) ?? 0) + 1);
  }
  const proposalTrend = months.map((m) => proposalsByMonth.get(m) ?? 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Empresas</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{companies.length}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Propostas</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{proposalCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Valor total (propostas)</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{asCurrency(proposalTotalValue)}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Atividades pendentes</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{activities.filter((item) => !item.done).length}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Indicadores</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ticket médio setup (BRL)</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{asCurrency(proposalAvgSetup)}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ticket médio mensal (BRL)</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{asCurrency(proposalAvgMonthly)}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total setup (BRL)</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{asCurrency(proposalTotalSetup)}</p>
            </div>
            <div className="rounded-md border border-border/60 p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total mensal (BRL)</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{asCurrency(proposalTotalMonthly)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Próximas atividades</h2>
          <div className="mt-3 space-y-2">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <div>
                  <p className="text-sm text-foreground">{activity.notes || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground">Vence em {activity.dueDate || "sem data"}</p>
                </div>
                <ActivityTypeBadge type={activity.type} />
              </div>
            ))}
            {upcomingActivities.length === 0 ? <p className="text-sm text-muted-foreground">Sem atividades próximas.</p> : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Empresas por etapa</h2>
              <p className="text-sm text-muted-foreground">Distribuição atual do kanban.</p>
            </div>
          </div>
          <div className="mt-4">
            <BarChart data={companiesStageData} />
          </div>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Propostas por etapa</h2>
              <p className="text-sm text-muted-foreground">Pipeline de propostas.</p>
            </div>
          </div>
          <div className="mt-4">
            <BarChart data={dealsStageData} />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Tendência de propostas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Quantidade de propostas por mês (últimos 8 meses).</p>
          <div className="mt-4">
            <Sparkline values={proposalTrend} />
          </div>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Resumo rápido</h2>
          <div className="mt-4 grid gap-2">
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <p className="text-sm text-foreground/80">Setup total (BRL)</p>
              <p className="text-sm font-semibold text-foreground">{asCurrency(proposalTotalSetup)}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <p className="text-sm text-foreground/80">Mensalidade total (BRL)</p>
              <p className="text-sm font-semibold text-foreground">{asCurrency(proposalTotalMonthly)}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <p className="text-sm text-foreground/80">Ticket médio setup (BRL)</p>
              <p className="text-sm font-semibold text-foreground">{asCurrency(proposalAvgSetup)}</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <p className="text-sm text-foreground/80">Ticket médio mensal (BRL)</p>
              <p className="text-sm font-semibold text-foreground">{asCurrency(proposalAvgMonthly)}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
