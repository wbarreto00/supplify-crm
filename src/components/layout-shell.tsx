import Link from "next/link";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-foreground">
              Supplify CRM
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted" href="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted" href="/companies">
              Empresas
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted" href="/deals">
              Propostas
            </Link>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
