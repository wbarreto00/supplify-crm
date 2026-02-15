import { ActivityTypeBadge, DealStageBadge } from "@/components/badges";
import { ActivityTypeOptions, CompanyStatusOptions, DealStageOptions } from "@/components/forms";
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
          <h2 className="text-lg font-semibold text-slate-900">Editar company</h2>
          <form action="/api/forms/company" method="post" className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=overview`} />

            <label className="text-sm text-slate-700">
              Nome
              <input
                name="name"
                defaultValue={company.name}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Segmento
              <input
                name="segment"
                defaultValue={company.segment}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Tamanho
              <input
                name="size"
                defaultValue={company.size}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Owner
              <input
                name="owner"
                defaultValue={company.owner}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700">
              Status
              <select
                name="status"
                defaultValue={company.status}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <CompanyStatusOptions />
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Origem
              <input
                name="source"
                defaultValue={company.source}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Notas
              <textarea
                name="notes"
                defaultValue={company.notes}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Salvar alterações
              </button>
            </div>
          </form>

          <form action="/api/forms/company" method="post" className="mt-4 border-t border-slate-100 pt-4">
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="id" value={company.id} />
            <input type="hidden" name="redirectTo" value="/companies" />
            <button
              type="submit"
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
            >
              Excluir company
            </button>
          </form>
        </section>
      ) : null}

      {currentTab === "contacts" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Contacts</h2>
          <form action="/api/forms/contact" method="post" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=contacts`} />

            <label className="text-sm text-slate-700">
              Nome
              <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Cargo
              <input name="role" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              E-mail
              <input name="email" type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Telefone
              <input name="phone" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              LinkedIn
              <input name="linkedin" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
                Criar contact
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-md border border-slate-200 p-3">
                <form action="/api/forms/contact" method="post" className="grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="action" value="update" />
                  <input type="hidden" name="id" value={contact.id} />
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=contacts`} />
                  <input
                    name="name"
                    defaultValue={contact.name}
                    required
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="role"
                    defaultValue={contact.role}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="email"
                    type="email"
                    defaultValue={contact.email}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="phone"
                    defaultValue={contact.phone}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="linkedin"
                    defaultValue={contact.linkedin}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <textarea
                    name="notes"
                    defaultValue={contact.notes}
                    rows={2}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
                <form action="/api/forms/contact" method="post" className="mt-2">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={contact.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=contacts`} />
                  <button
                    type="submit"
                    className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
                  >
                    Excluir
                  </button>
                </form>
              </article>
            ))}
            {contacts.length === 0 ? <p className="text-sm text-slate-500">Sem contacts cadastrados.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "deals" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Deals</h2>
          <form action="/api/forms/deal" method="post" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=deals`} />
            <label className="text-sm text-slate-700">
              Título
              <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Stage
              <select name="stage" defaultValue="new" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <DealStageOptions />
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Valor
              <input name="value" type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Setup
              <input name="setupValue" type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Mensalidade
              <input name="monthlyValue" type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Probabilidade
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
                <form action="/api/forms/deal" method="post" className="grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="action" value="update" />
                  <input type="hidden" name="id" value={deal.id} />
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=deals`} />
                  <input
                    name="title"
                    defaultValue={deal.title}
                    required
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <select
                    name="stage"
                    defaultValue={deal.stage}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <DealStageOptions />
                  </select>
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={deal.value}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="setupValue"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={deal.setupValue}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="monthlyValue"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={deal.monthlyValue}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={deal.probability}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="closeDate"
                    type="date"
                    defaultValue={deal.closeDate}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="owner"
                    defaultValue={deal.owner}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    name="notes"
                    defaultValue={deal.notes}
                    rows={2}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
                <form action="/api/forms/deal" method="post" className="mt-2">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={deal.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=deals`} />
                  <button
                    type="submit"
                    className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
                  >
                    Excluir
                  </button>
                </form>
              </article>
            ))}
            {deals.length === 0 ? <p className="text-sm text-slate-500">Sem deals cadastrados.</p> : null}
          </div>
        </section>
      ) : null}

      {currentTab === "activities" ? (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Activities</h2>
          <form action="/api/forms/activity" method="post" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="action" value="create" />
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />
            <label className="text-sm text-slate-700">
              Tipo
              <select name="type" defaultValue="task" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <ActivityTypeOptions />
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Contact (opcional)
              <select name="contactId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Nenhum</option>
                {contacts.map((contact) => (
                  <option value={contact.id} key={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              Vencimento
              <input name="dueDate" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
                Criar activity
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {activities.map((activity) => (
              <article key={activity.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-900">{activity.notes || "Sem descrição"}</p>
                  <ActivityTypeBadge type={activity.type} />
                </div>
                <form action="/api/forms/activity" method="post" className="grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="action" value="update" />
                  <input type="hidden" name="id" value={activity.id} />
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />
                  <select
                    name="type"
                    defaultValue={activity.type}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <ActivityTypeOptions />
                  </select>
                  <select
                    name="contactId"
                    defaultValue={activity.contactId}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {contacts.map((contact) => (
                      <option value={contact.id} key={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={activity.dueDate}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                    <input name="done" type="checkbox" defaultChecked={activity.done} />
                    Concluída
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={activity.notes}
                    rows={2}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
                <form action="/api/forms/activity" method="post" className="mt-2">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={activity.id} />
                  <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />
                  <button
                    type="submit"
                    className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500"
                  >
                    Excluir
                  </button>
                </form>
              </article>
            ))}
            {activities.length === 0 ? <p className="text-sm text-slate-500">Sem activities cadastradas.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
