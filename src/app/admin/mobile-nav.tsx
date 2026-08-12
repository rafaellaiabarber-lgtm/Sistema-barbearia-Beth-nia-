"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import type { NavGrupo } from "./nav-links";

export function MobileNav({ grupos, nome }: { grupos: NavGrupo[]; nome: string }) {
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
        <nav className="absolute left-0 top-full z-10 w-64 max-h-[80vh] overflow-y-auto bg-white border border-slate-200 rounded-br-xl shadow-xl flex flex-col gap-3 p-3">
          {grupos.map((g) => (
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
                    onClick={() => setAberto(false)}
                    className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <form action={logout} className="border-t border-slate-200 pt-2">
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
