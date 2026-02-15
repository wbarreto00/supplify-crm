import { ActivityTypeBadge } from "@/components/badges";
import { COMPANY_STATUSES, DEAL_STAGES } from "@/lib/constants";
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

  const companiesByStatus = Object.fromEntries(
    COMPANY_STATUSES.map((status) => [status, companies.filter((c) => c.status === status).length]),
  ) as Record<(typeof COMPANY_STATUSES)[number], number>;

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

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Companies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{companies.length}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Propostas</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{proposalCount}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Valor total (propostas)</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{asCurrency(proposalTotalValue)}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Atividades pendentes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{activities.filter((item) => !item.done).length}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Indicadores</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ticket médio setup</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{asCurrency(proposalAvgSetup)}</p>
            </div>
            <div className="rounded-md border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Ticket médio recorrente</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{asCurrency(proposalAvgMonthly)}</p>
            </div>
            <div className="rounded-md border border-slate-100 p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total setup (propostas)</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{asCurrency(proposalTotalSetup)}</p>
            </div>
            <div className="rounded-md border border-slate-100 p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total recorrente (propostas)</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{asCurrency(proposalTotalMonthly)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Próximas atividades</h2>
          <div className="mt-3 space-y-2">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm text-slate-900">{activity.notes || "Sem descrição"}</p>
                  <p className="text-xs text-slate-500">Vence em {activity.dueDate || "sem data"}</p>
                </div>
                <ActivityTypeBadge type={activity.type} />
              </div>
            ))}
            {upcomingActivities.length === 0 ? <p className="text-sm text-slate-500">Sem atividades próximas.</p> : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Companies por status</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {COMPANY_STATUSES.map((status) => (
              <div key={status} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <p className="text-sm text-slate-700">{status}</p>
                <p className="text-sm font-semibold text-slate-900">{companiesByStatus[status]}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Deals por stage</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DEAL_STAGES.map((stage) => (
              <div key={stage} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <p className="text-sm text-slate-700">{stage}</p>
                <p className="text-sm font-semibold text-slate-900">{dealsByStage[stage]}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
