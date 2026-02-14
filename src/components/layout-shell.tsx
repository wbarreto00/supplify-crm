import Link from "next/link";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
              Supplify CRM
            </Link>
            <p className="text-xs text-slate-500">Operação comercial simples para humanos e agentes</p>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/companies">
              Companies
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/deals">
              Deals
            </Link>
            <form action="/api/logout" method="post">
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
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
