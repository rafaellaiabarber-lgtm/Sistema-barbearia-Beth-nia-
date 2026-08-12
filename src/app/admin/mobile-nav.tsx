"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";

type NavLink = { href: string; label: string };

export function MobileNav({ links, nome }: { links: NavLink[]; nome: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden border-b border-neutral-800 relative">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="text-2xl leading-none text-neutral-300 hover:text-amber-400 px-1"
        >
          ⋮
        </button>
        <div>
          <p className="font-bold text-lg">Barbearia Bethânia</p>
          <p className="text-neutral-500 text-sm">Olá, {nome}</p>
        </div>
      </div>

      {aberto && (
        <nav className="absolute left-0 top-full z-10 w-56 bg-neutral-900 border border-neutral-800 rounded-br-xl shadow-xl flex flex-col gap-1 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-amber-400"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/fila"
            onClick={() => setAberto(false)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-amber-400"
          >
            Fila de atendimento
          </Link>
          <form action={logout} className="border-t border-neutral-800 mt-1 pt-2">
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
