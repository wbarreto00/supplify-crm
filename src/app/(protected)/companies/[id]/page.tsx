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
  const latestDeal = [...deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;

  function asCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  const tabLabel: Record<TabName, string> = {
    overview: "Visão geral",
    contacts: "Contatos",
    deals: "Propostas",
    activities: "Atividades",
  };

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{company.name}</h1>
          </div>
          <Link href="/companies" className="rounded-md border border-border px-3 py-2 text-sm text-foreground/80 hover:bg-muted">
            Voltar para lista
          </Link>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {tabs.map((item) => (
            <Link
              key={item}
              href={tabHref(company.id, item)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                currentTab === item ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80 hover:bg-muted/70"
              }`}
            >
              {tabLabel[item]}
            </Link>
          ))}
        </nav>
      </header>

      {currentTab === "overview" ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Etapa</p>
                  <p className="mt-2">
                    <DealStageBadge stage={company.stage} />
                  </p>
                </div>
                <div className="rounded-md border border-border/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dono</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{company.owner || "-"}</p>
                </div>
                <div className="rounded-md border border-border/60 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposta (última)</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {latestDeal ? latestDeal.title : "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Setup (BRL): {asCurrency(latestDeal?.setupValue ?? 0)} | Mensalidade (BRL): {asCurrency(latestDeal?.monthlyValue ?? 0)}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Origem</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{company.source || "-"}</p>
                </div>
                <div className="rounded-md border border-border/60 p-3 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{company.notes || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/companies/${company.id}/edit`}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Editar
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {currentTab === "contacts" ? (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Contatos</h2>
            <Link
              href={`/companies/${company.id}/contacts/new`}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Contato
            </Link>
          </div>

          <div className="space-y-4">
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {contact.role || "-"} | {contact.email || "-"} | {contact.phone || "-"}
                    </p>
                    {contact.linkedin ? <p className="mt-1 text-xs text-muted-foreground">LinkedIn: {contact.linkedin}</p> : null}
                  </div>
                  <Link
                    href={`/companies/${company.id}/contacts/${contact.id}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {contacts.length === 0 ? <p className="text-sm text-muted-foreground">Sem contatos cadastrados.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "deals" ? (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Propostas</h2>
            <Link
              href={`/deals/new?companyId=${encodeURIComponent(company.id)}&redirectTo=${encodeURIComponent(`/companies/${company.id}?tab=deals`)}`}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Proposta
            </Link>
          </div>

          <div className="space-y-4">
            {deals.map((deal) => (
              <article key={deal.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Setup (BRL) {asCurrency(deal.setupValue)} | Mensalidade (BRL) {asCurrency(deal.monthlyValue)}
                    </p>
                  </div>
                  <DealStageBadge stage={deal.stage} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Link
                    href={`/deals/${deal.id}/edit?redirectTo=${encodeURIComponent(`/companies/${company.id}?tab=deals`)}`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {deals.length === 0 ? <p className="text-sm text-muted-foreground">Sem propostas cadastradas.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "activities" ? (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Atividades</h2>
            <Link
              href={`/companies/${company.id}/activities/new`}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Atividade
            </Link>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <article key={activity.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-foreground">{activity.notes || "Sem descrição"}</p>
                  <ActivityTypeBadge type={activity.type} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {activity.dueDate ? `Vence em ${activity.dueDate}` : "Sem data"} |{" "}
                    {activity.done ? "Concluída" : "Pendente"}
                  </p>
                  <Link
                    href={`/companies/${company.id}/activities/${activity.id}/edit`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
            {activities.length === 0 ? <p className="text-sm text-muted-foreground">Sem atividades cadastradas.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
