import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { obterConfiguracaoTotem } from "@/lib/actions/totem";
import { ehDonoPlataforma } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { gruposNav, type NavGrupo } from "./nav-links";
import { ThemeToggle } from "../theme-toggle";
import { ValoresToggle } from "../valores-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);
  const [configuracao, minhaBarbearia] = await Promise.all([
    obterConfiguracaoTotem(session.barbeariaId),
    prisma.barbearia.findUnique({ where: { id: session.barbeariaId }, select: { nome: true } }),
  ]);
  const logoUrl = configuracao?.logoMenuUrl ?? configuracao?.logoUrl ?? null;

  const souDono = await ehDonoPlataforma(session.barbeariaId);
  const grupos: NavGrupo[] = souDono
    ? [
        ...gruposNav,
        {
          titulo: "Plataforma",
          icone: "plataforma",
          links: [{ href: "/dono", label: "Barbearias cadastradas", icone: "plataforma" }],
        },
      ]
    : gruposNav;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row">
      <MobileNav grupos={grupos} nome={session.nome} nomeBarbearia={minhaBarbearia?.nome ?? "Barbearia"} logoUrl={logoUrl} />

      <aside className="hidden md:flex w-64 shrink-0 bg-neutral-950 border-r border-orange-500/10 p-5 flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2 min-w-0">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-10 w-auto max-w-10 rounded-md object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-lg text-white truncate">{minhaBarbearia?.nome ?? "Barbearia"}</p>
              <p className="text-orange-400 text-sm">Olá, {session.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ValoresToggle className="text-orange-400 hover:text-white hover:bg-orange-500/10" />
            <ThemeToggle className="text-orange-400 hover:text-white hover:bg-orange-500/10" />
          </div>
        </div>

        <SidebarNav grupos={grupos} />

        <form action={logout} className="mt-4 pt-4 border-t border-white/10">
          <button className="text-orange-400 hover:text-white text-sm">Sair</button>
        </form>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
