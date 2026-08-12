import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logout } from "@/lib/actions/auth";

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
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-56 md:shrink-0 border-b md:border-b-0 md:border-r border-neutral-800 p-4 md:p-5 flex flex-col">
        <div className="mb-3 md:mb-8 flex items-center justify-between md:block">
          <div>
            <p className="font-bold text-lg">Barbearia Bethânia</p>
            <p className="text-neutral-500 text-sm">Olá, {session.nome}</p>
          </div>
          <form action={logout} className="md:hidden">
            <button className="text-neutral-500 hover:text-white text-sm">Sair</button>
          </form>
        </div>
        <nav className="flex flex-row md:flex-col gap-1 flex-1 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-amber-400 whitespace-nowrap shrink-0"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/fila"
            className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-amber-400 whitespace-nowrap shrink-0"
          >
            Fila de atendimento
          </Link>
        </nav>
        <form action={logout} className="hidden md:block">
          <button className="text-neutral-500 hover:text-white text-sm">Sair</button>
        </form>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
