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
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Editar atividade</h1>
            <p className="text-sm text-muted-foreground">{company.name}</p>
          </div>
          <Link
            href={`/companies/${company.id}?tab=activities`}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <form action="/api/forms/activity" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="id" value={activity.id} />
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />

          <label className="text-sm text-foreground/80">
            Tipo
            <select
              name="type"
              defaultValue={activity.type}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <ActivityTypeOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Contato (opcional)
            <select
              name="contactId"
              defaultValue={activity.contactId}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Nenhum</option>
              {contacts.map((contact) => (
                <option value={contact.id} key={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Vencimento
            <input
              name="dueDate"
              type="date"
              defaultValue={activity.dueDate}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground/80 md:mt-6">
            <input name="done" type="checkbox" defaultChecked={activity.done} />
            Concluída
          </label>
          <label className="text-sm text-foreground/80 md:col-span-2">
            Comunicação / resumo
            <textarea
              name="notes"
              defaultValue={activity.notes}
              rows={4}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Salvar
            </button>
            <Link
              href={`/companies/${company.id}?tab=activities`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-destructive/30 bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Excluir</h2>
        <form action="/api/forms/activity" method="post" className="mt-4">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={activity.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=activities`} />
          <button
            type="submit"
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
          >
            Excluir atividade
          </button>
        </form>
      </section>
    </div>
  );
}
