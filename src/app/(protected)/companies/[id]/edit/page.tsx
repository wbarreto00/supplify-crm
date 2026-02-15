import { CompanySourceOptions, CompanyStageOptions } from "@/components/forms";
import { getCompanyById } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type EditCompanyPageProps = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Editar: {company.name}</h1>
          </div>
          <Link
            href={`/companies/${company.id}?tab=overview`}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <form action="/api/forms/company" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="id" value={company.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=overview`} />

          <label className="text-sm text-foreground/80">
            Nome
            <input
              name="name"
              defaultValue={company.name}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Etapa
            <select name="stage" defaultValue={company.stage} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <CompanyStageOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Dono
            <input
              name="owner"
              defaultValue={company.owner}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Origem
            <select name="source" defaultValue={company.source} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Selecione</option>
              <CompanySourceOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80 md:col-span-2">
            Notas
            <textarea
              name="notes"
              defaultValue={company.notes}
              rows={3}
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
              href={`/companies/${company.id}?tab=overview`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-destructive/30 bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Zona de risco</h2>
        <p className="mt-1 text-sm text-muted-foreground">Excluir remove empresa, contatos, propostas e atividades vinculadas.</p>
        <form action="/api/forms/company" method="post" className="mt-4">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={company.id} />
          <input type="hidden" name="redirectTo" value="/companies" />
          <button
            type="submit"
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
          >
            Excluir empresa
          </button>
        </form>
      </section>
    </div>
  );
}
