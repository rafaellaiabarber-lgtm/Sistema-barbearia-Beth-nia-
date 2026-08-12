import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/caixa", label: "Caixa" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/barbeiros", label: "Barbeiros" },
  { href: "/admin/clientes", label: "Clientes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      <MobileNav links={links} nome={session.nome} />

      <aside className="hidden md:flex w-56 shrink-0 border-r border-slate-200 bg-white p-5 flex-col">
        <div className="mb-8">
          <p className="font-bold text-lg">Barbearia Bethânia</p>
          <p className="text-slate-500 text-sm">Olá, {session.nome}</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/fila"
            className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
          >
            Fila de atendimento
          </Link>
        </nav>
        <form action={logout}>
          <button className="text-slate-400 hover:text-slate-900 text-sm">Sair</button>
        </form>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
