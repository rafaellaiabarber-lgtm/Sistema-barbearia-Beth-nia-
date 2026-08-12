"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";

type NavLink = { href: string; label: string };

export function MobileNav({ links, nome }: { links: NavLink[]; nome: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden border-b border-slate-200 bg-white relative">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="text-2xl leading-none text-slate-500 hover:text-blue-600 px-1"
        >
          ⋮
        </button>
        <div>
          <p className="font-bold text-lg">Barbearia Bethânia</p>
          <p className="text-slate-500 text-sm">Olá, {nome}</p>
        </div>
      </div>

      {aberto && (
        <nav className="absolute left-0 top-full z-10 w-56 bg-white border border-slate-200 rounded-br-xl shadow-xl flex flex-col gap-1 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/fila"
            onClick={() => setAberto(false)}
            className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
          >
            Fila de atendimento
          </Link>
          <form action={logout} className="border-t border-slate-200 mt-1 pt-2">
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
