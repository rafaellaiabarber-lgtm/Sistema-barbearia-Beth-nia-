"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { NavGrupo } from "./nav-links";
import { ICONES_NAV } from "./nav-icones";
import { ThemeToggle } from "../theme-toggle";

export function MobileNav({ grupos, nome }: { grupos: NavGrupo[]; nome: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden border-b border-lime-500/10 bg-black relative">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={aberto}
            className="text-lime-300 hover:text-white p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <p className="font-bold text-lg text-white">Barbearia Bethânia</p>
            <p className="text-lime-400 text-sm">Olá, {nome}</p>
          </div>
        </div>
        <ThemeToggle className="text-lime-400 hover:text-white hover:bg-lime-500/10 shrink-0" />
      </div>

      {aberto && (
        <nav className="absolute left-0 top-full z-10 w-64 max-h-[80vh] overflow-y-auto bg-black border border-lime-500/10 rounded-br-xl shadow-xl flex flex-col gap-3 p-3">
          {grupos.map((g) => (
            <div key={g.titulo ?? "raiz"}>
              {g.titulo && (
                <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-lime-400">{g.titulo}</p>
              )}
              <div className="flex flex-col gap-1">
                {g.links.map((l) => {
                  const Icone = ICONES_NAV[l.icone];
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setAberto(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-lime-100/80 hover:bg-lime-500/10 hover:text-white"
                    >
                      <Icone className="w-4 h-4 shrink-0" />
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <form action={logout} className="border-t border-white/10 pt-2">
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-lime-400 hover:bg-lime-500/10 hover:text-white">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
