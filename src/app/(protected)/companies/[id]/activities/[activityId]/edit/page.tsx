import { ActivityTypeOptions } from "@/components/forms";
import { getCompanyById, listActivities, listContacts } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type EditActivityPageProps = {
  params: Promise<{ id: string; activityId: string }>;
};

export const runtime = "nodejs";

export default async function EditActivityPage({ params }: EditActivityPageProps) {
  const { id, activityId } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const activities = await listActivities();
  const activity = activities.find((item) => item.id === activityId && item.companyId === company.id) ?? null;
  if (!activity) notFound();

  const contacts = (await listContacts()).filter((c) => c.companyId === company.id);

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Company</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Editar activity</h1>
            <p className="text-sm text-slate-600">{company.name}</p>
          </div>
          <Link
            href={`/companies/${company.id}?tab=activities`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action="/api/forms/activity" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="id" value={activity.id} />
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />

          <label className="text-sm text-slate-700">
            Tipo
            <select
              name="type"
              defaultValue={activity.type}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <ActivityTypeOptions />
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Contact (opcional)
            <select
              name="contactId"
              defaultValue={activity.contactId}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
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
            <input
              name="dueDate"
              type="date"
              defaultValue={activity.dueDate}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 md:mt-6">
            <input name="done" type="checkbox" defaultChecked={activity.done} />
            Concluída
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Comunicação / resumo
            <textarea
              name="notes"
              defaultValue={activity.notes}
              rows={4}
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
              href={`/companies/${company.id}?tab=activities`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-rose-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Excluir</h2>
        <form action="/api/forms/activity" method="post" className="mt-4">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={activity.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />
          <button
            type="submit"
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            Excluir activity
          </button>
        </form>
      </section>
    </div>
  );
}

