import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { obterConfiguracaoTotem } from "@/lib/actions/totem";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { gruposNav } from "./nav-links";
import { ThemeToggle } from "../theme-toggle";
import { ValoresToggle } from "../valores-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, configuracao] = await Promise.all([requireSession(["ADMIN"]), obterConfiguracaoTotem()]);
  const logoUrl = configuracao?.logoMenuUrl ?? configuracao?.logoUrl ?? null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      <MobileNav grupos={gruposNav} nome={session.nome} logoUrl={logoUrl} />

      <aside className="hidden md:flex w-64 shrink-0 bg-black border-r border-blue-500/10 p-5 flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2 min-w-0">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-white shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-lg text-white">Barbearia Bethânia</p>
              <p className="text-blue-400 text-sm">Olá, {session.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ValoresToggle className="text-blue-400 hover:text-white hover:bg-blue-500/10" />
            <ThemeToggle className="text-blue-400 hover:text-white hover:bg-blue-500/10" />
          </div>
        </div>

        <SidebarNav grupos={gruposNav} />

        <form action={logout} className="mt-4 pt-4 border-t border-white/10">
          <button className="text-blue-400 hover:text-white text-sm">Sair</button>
        </form>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
