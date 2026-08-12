import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { MobileNav } from "./mobile-nav";
import { gruposNav } from "./nav-links";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      <MobileNav grupos={gruposNav} nome={session.nome} />

      <aside className="hidden md:flex w-56 shrink-0 border-r border-slate-200 bg-white p-5 flex-col overflow-y-auto">
        <div className="mb-8">
          <p className="font-bold text-lg">Barbearia Bethânia</p>
          <p className="text-slate-500 text-sm">Olá, {session.nome}</p>
        </div>
        <nav className="flex flex-col gap-4 flex-1">
          {gruposNav.map((g) => (
            <div key={g.titulo ?? "raiz"}>
              {g.titulo && (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {g.titulo}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {g.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <form action={logout}>
          <button className="text-slate-400 hover:text-slate-900 text-sm">Sair</button>
        </form>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
