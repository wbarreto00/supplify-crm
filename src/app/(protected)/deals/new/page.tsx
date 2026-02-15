import { DealStageOptions } from "@/components/forms";
import { listCompanies } from "@/lib/repository";
import Link from "next/link";

type NewDealPageProps = {
  searchParams: Promise<{ companyId?: string; redirectTo?: string }>;
};

export const runtime = "nodejs";

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const { companyId = "", redirectTo = "/deals" } = await searchParams;
  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Novo deal</h1>
            <p className="text-sm text-slate-600">Cadastro separado para manter o board limpo.</p>
          </div>
          <Link
            href={redirectTo}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form action="/api/forms/deal" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <label className="text-sm text-slate-700">
            Company
            <select
              name="companyId"
              required
              defaultValue={companyId}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
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
            Valor total
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
            Probabilidade (%)
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
            <textarea name="notes" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Criar deal
            </button>
            <Link
              href={redirectTo}
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

