import { ActivityTypeOptions } from "@/components/forms";
import { listContacts, getCompanyById } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type NewActivityPageProps = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export default async function NewActivityPage({ params }: NewActivityPageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const contacts = (await listContacts()).filter((c) => c.companyId === company.id);

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Company</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Nova activity</h1>
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
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />

          <label className="text-sm text-slate-700">
            Tipo
            <select
              name="type"
              defaultValue="task"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
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
          <label className="text-sm text-slate-700">
            Concluída
            <div className="mt-2 flex items-center gap-2">
              <input name="done" type="checkbox" />
              <span className="text-sm text-slate-600">Marcar como concluída</span>
            </div>
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Comunicação / resumo
            <textarea name="notes" rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Criar activity
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
    </div>
  );
}

