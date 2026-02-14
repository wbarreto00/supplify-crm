import { CompanyStatusBadge } from "@/components/badges";
import { CompanyStatusOptions } from "@/components/forms";
import { COMPANY_STATUSES } from "@/lib/constants";
import { listCompanies } from "@/lib/repository";
import Link from "next/link";

type CompaniesPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export const runtime = "nodejs";

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const { q = "", status = "" } = await searchParams;
  const companies = await listCompanies();
  const normalizedQuery = q.trim().toLowerCase();

  const filtered = companies.filter((company) => {
    const queryMatch =
      normalizedQuery.length === 0 ||
      [company.name, company.segment, company.owner, company.source, company.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const statusMatch = status ? company.status === status : true;
    return queryMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Companies</h1>
            <p className="text-sm text-slate-600">Busca, filtros, cadastro e exportação.</p>
          </div>
          <a
            href="/api/export/companies"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Exportar CSV
          </a>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-4" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, owner, origem..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-3"
          />
          <select name="status" defaultValue={status} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            <CompanyStatusOptions />
          </select>
          <div className="md:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Filtrar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Nova company</h2>
        <form action="/api/forms/company" method="post" className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="redirectTo" value="/companies" />

          <label className="text-sm text-slate-700">
            Nome
            <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Segmento
            <input name="segment" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Tamanho
            <input name="size" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Owner
            <input name="owner" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700">
            Status
            <select name="status" defaultValue="lead" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {COMPANY_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Origem
            <input name="source" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-slate-700 md:col-span-2">
            Notas
            <textarea
              name="notes"
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Criar company
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Lista ({filtered.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Nome</th>
                <th className="pb-2 font-medium">Segmento</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <Link href={`/companies/${company.id}`} className="font-medium text-sky-700 hover:underline">
                      {company.name}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-700">{company.segment || "-"}</td>
                  <td className="py-3 text-slate-700">{company.owner || "-"}</td>
                  <td className="py-3">
                    <CompanyStatusBadge status={company.status} />
                  </td>
                  <td className="py-3 text-slate-700">{new Date(company.updatedAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhuma company encontrada.</p> : null}
        </div>
      </section>
    </div>
  );
}
