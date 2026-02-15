import { CompanySourceOptions, CompanyStageOptions } from "@/components/forms";
import Link from "next/link";

export const runtime = "nodejs";

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Nova empresa</h1>
            <p className="text-sm text-muted-foreground">Cadastro separado para manter as listas limpas.</p>
          </div>
          <Link
            href="/companies"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <form action="/api/forms/company" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="redirectTo" value="/companies" />

          <label className="text-sm text-foreground/80">
            Nome
            <input name="name" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80">
            Etapa
            <select name="stage" defaultValue="new" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <CompanyStageOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Dono
            <input name="owner" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80">
            Origem
            <select name="source" defaultValue="" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Selecione</option>
              <CompanySourceOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80 md:col-span-2">
            Notas
            <textarea name="notes" rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Criar empresa
            </button>
            <Link
              href="/companies"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
