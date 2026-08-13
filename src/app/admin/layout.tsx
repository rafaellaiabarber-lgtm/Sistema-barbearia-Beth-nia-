import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { gruposNav } from "./nav-links";
import { ThemeToggle } from "../theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <MobileNav grupos={gruposNav} nome={session.nome} />

      <aside className="hidden md:flex w-64 shrink-0 bg-lime-950 p-5 flex-col">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-bold text-lg text-white">Barbearia Bethânia</p>
            <p className="text-lime-300 text-sm">Olá, {session.nome}</p>
          </div>
          <ThemeToggle className="text-lime-300 hover:text-white hover:bg-lime-800/60 shrink-0" />
        </div>

        <SidebarNav grupos={gruposNav} />

        <form action={logout} className="mt-4 pt-4 border-t border-lime-800">
          <button className="text-lime-300 hover:text-white text-sm">Sair</button>
        </form>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
