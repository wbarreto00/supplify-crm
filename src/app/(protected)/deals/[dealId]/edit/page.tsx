import { DealStageOptions } from "@/components/forms";
import { listCompanies, listDeals } from "@/lib/repository";
import Link from "next/link";
import { notFound } from "next/navigation";

type EditDealPageProps = {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
};

export const runtime = "nodejs";

export default async function EditDealPage({ params, searchParams }: EditDealPageProps) {
  const { dealId } = await params;
  const { redirectTo = "/deals" } = await searchParams;

  const [deals, companies] = await Promise.all([listDeals(), listCompanies()]);
  const deal = deals.find((item) => item.id === dealId) ?? null;
  if (!deal) notFound();

  const company = companies.find((c) => c.id === deal.companyId) ?? null;

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Proposta</p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{deal.title}</h1>
            <p className="text-sm text-muted-foreground">{company?.name || "Sem empresa"}</p>
          </div>
          <div className="flex items-center gap-2">
            {company ? (
              <Link
                href={`/companies/${company.id}?tab=deals`}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                Ver empresa
              </Link>
            ) : null}
            <Link
              href={redirectTo}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <form action="/api/forms/deal" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="id" value={deal.id} />
          <input type="hidden" name="companyId" value={deal.companyId} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <label className="text-sm text-foreground/80">
            Título
            <input
              name="title"
              defaultValue={deal.title}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Etapa
            <select
              name="stage"
              defaultValue={deal.stage}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <DealStageOptions />
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Total (BRL)
            <input
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.value}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Setup (BRL)
            <input
              name="setupValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.setupValue}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Mensalidade (BRL)
            <input
              name="monthlyValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={deal.monthlyValue}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Probabilidade (%)
            <input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue={deal.probability}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Fechamento
            <input
              name="closeDate"
              type="date"
              defaultValue={deal.closeDate}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80">
            Dono
            <input
              name="owner"
              defaultValue={deal.owner}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-foreground/80 md:col-span-2">
            Notas
            <textarea
              name="notes"
              defaultValue={deal.notes}
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
              href={redirectTo}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-destructive/30 bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Excluir</h2>
        <form action="/api/forms/deal" method="post" className="mt-4">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={deal.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
          >
            Excluir proposta
          </button>
        </form>
      </section>
    </div>
  );
}
