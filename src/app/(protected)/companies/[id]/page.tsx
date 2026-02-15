import { ActivityTypeBadge, DealStageBadge } from "@/components/badges";
import { getActivitiesByCompanyId, getCompanyById, getContactsByCompanyId, getDealsByCompanyId } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type CompanyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const tabs = ["overview", "contacts", "deals", "activities"] as const;
type TabName = (typeof tabs)[number];

function getCurrentTab(tab: string | undefined): TabName {
  return tabs.includes(tab as TabName) ? (tab as TabName) : "overview";
}

function tabHref(companyId: string, tab: TabName): string {
  return `/companies/${companyId}?tab=${tab}`;
}

export const runtime = "nodejs";

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  const [contacts, deals, activities] = await Promise.all([
    getContactsByCompanyId(company.id),
    getDealsByCompanyId(company.id),
    getActivitiesByCompanyId(company.id),
  ]);

  const currentTab = getCurrentTab(tab);

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Company</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-600">{company.segment || "Sem segmento"}</p>
          </div>
          <Link href="/companies" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Voltar para lista
          </Link>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {tabs.map((item) => (
            <Link
              key={item}
              href={tabHref(company.id, item)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentTab === item ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </header>

      {currentTab === "overview" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{company.status}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{company.owner || "-"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Segmento</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{company.segment || "-"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tamanho</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{company.size || "-"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Origem</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{company.source || "-"}</p>
                </div>
                <div className="rounded-md border border-slate-100 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notas</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{company.notes || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/companies/${company.id}/edit`}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Editar
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {currentTab === "contacts" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Contacts</h2>
            <Link
              href={`/companies/${company.id}/contacts/new`}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              + Contact
            </Link>
          </div>

          <div className="space-y-4">
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {contact.role || "-"} | {contact.email || "-"} | {contact.phone || "-"}
                    </p>
                    {contact.linkedin ? <p className="mt-1 text-xs text-slate-500">LinkedIn: {contact.linkedin}</p> : null}
                  </div>
                  <Link
                    href={`/companies/${company.id}/contacts/${contact.id}/edit`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {contacts.length === 0 ? <p className="text-sm text-slate-500">Sem contacts cadastrados.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "deals" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Deals</h2>
            <Link
              href={`/deals/new?companyId=${encodeURIComponent(company.id)}&redirectTo=${encodeURIComponent(`/companies/${company.id}?tab=deals`)}`}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              + Deal
            </Link>
          </div>

          <div className="space-y-4">
            {deals.map((deal) => (
              <article key={deal.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                    <p className="text-xs text-slate-500">
                      Setup {deal.setupValue.toLocaleString("pt-BR")} | Mensal {deal.monthlyValue.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <DealStageBadge stage={deal.stage} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Link
                    href={`/deals/${deal.id}/edit?redirectTo=${encodeURIComponent(`/companies/${company.id}?tab=deals`)}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {deals.length === 0 ? <p className="text-sm text-slate-500">Sem deals cadastrados.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "activities" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Activities</h2>
            <Link
              href={`/companies/${company.id}/activities/new`}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              + Activity
            </Link>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <article key={activity.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-900">{activity.notes || "Sem descrição"}</p>
                  <ActivityTypeBadge type={activity.type} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    {activity.dueDate ? `Vence em ${activity.dueDate}` : "Sem data"} |{" "}
                    {activity.done ? "Concluída" : "Pendente"}
                  </p>
                  <Link
                    href={`/companies/${company.id}/activities/${activity.id}/edit`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {activities.length === 0 ? <p className="text-sm text-slate-500">Sem activities cadastradas.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
