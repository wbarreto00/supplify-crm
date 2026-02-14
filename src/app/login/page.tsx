import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Supplify CRM</h1>
        <p className="mt-2 text-sm text-slate-600">Faça login para acessar o painel interno.</p>

        <form action="/api/login" method="post" className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Senha de administrador
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="••••••••"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Entrar
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Credenciais inválidas. Tente novamente.
          </p>
        ) : null}
      </section>
    </div>
  );
}
