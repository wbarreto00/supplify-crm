import { getCompanyById } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type NewContactPageProps = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export default async function NewContactPage({ params }: NewContactPageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Company</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Novo contact</h1>
            <p className="text-sm text-slate-600">{company.name}</p>
          </div>
          <Link
            href={`/companies/${company.id}?tab=contacts`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
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
            <textarea name="notes" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Criar contact
            </button>
            <Link
              href={`/companies/${company.id}?tab=contacts`}
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

