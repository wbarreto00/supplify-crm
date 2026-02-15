import { CompanyStatusOptions } from "@/components/forms";
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
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Company</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Editar: {company.name}</h1>
          </div>
          <Link
            href={`/companies/${company.id}?tab=overview`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action="/api/forms/company" method="post" className="grid gap-3 md:grid-cols-2">
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
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Salvar
            </button>
            <Link
              href={`/companies/${company.id}?tab=overview`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-rose-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Zona de risco</h2>
        <p className="mt-1 text-sm text-slate-600">Excluir remove company, contacts, deals e activities vinculadas.</p>
        <form action="/api/forms/company" method="post" className="mt-4">
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
    </div>
  );
}

