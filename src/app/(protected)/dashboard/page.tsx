import { ActivityTypeBadge, CompanyStatusBadge, DealStageBadge } from "@/components/badges";
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

  const openDeals = deals.filter((deal) => !["won", "lost"].includes(deal.stage));
  const wonValue = deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + deal.value, 0);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingActivities = activities
    .filter((activity) => !activity.done && activity.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Companies</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{companies.length}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Deals em aberto</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{openDeals.length}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Valor ganho</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{asCurrency(wonValue)}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Atividades pendentes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{activities.filter((item) => !item.done).length}</p>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Pipeline recente</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Deal</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 6).map((deal) => (
                <tr key={deal.id} className="border-b border-slate-100">
                  <td className="py-3">{deal.title}</td>
                  <td className="py-3">
                    <DealStageBadge stage={deal.stage} />
                  </td>
                  <td className="py-3">{asCurrency(deal.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {deals.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhum deal cadastrado.</p> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Companies recentes</h2>
          <div className="mt-3 space-y-2">
            {companies.slice(0, 6).map((company) => (
              <div key={company.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.owner || "Sem owner"}</p>
                </div>
                <CompanyStatusBadge status={company.status} />
              </div>
            ))}
            {companies.length === 0 ? <p className="text-sm text-slate-500">Nenhuma company cadastrada.</p> : null}
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
    </div>
  );
}
