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
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <aside className="w-56 shrink-0 border-r border-neutral-800 p-5 flex flex-col">
        <div className="mb-8">
          <p className="font-bold text-lg">Barbearia Beth Nia</p>
          <p className="text-neutral-500 text-sm">Olá, {session.nome}</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-amber-400"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/fila"
            className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-amber-400"
          >
            Fila de atendimento
          </Link>
        </nav>
        <form action={logout}>
          <button className="text-neutral-500 hover:text-white text-sm">Sair</button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
