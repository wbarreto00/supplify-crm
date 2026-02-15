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
      <header className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Novo contato</h1>
            <p className="text-sm text-muted-foreground">{company.name}</p>
          </div>
          <Link
            href={`/companies/${company.id}?tab=contacts`}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <form action="/api/forms/contact" method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="redirectTo" value={`/companies/${company.id}?tab=contacts`} />

          <label className="text-sm text-foreground/80">
            Nome
            <input name="name" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80">
            Cargo
            <input name="role" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80">
            E-mail
            <input name="email" type="email" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80">
            Telefone / WhatsApp
            <input name="phone" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-foreground/80 md:col-span-2">
            LinkedIn
            <input name="linkedin" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
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
              Criar contato
            </button>
            <Link
              href={`/companies/${company.id}?tab=contacts`}
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
