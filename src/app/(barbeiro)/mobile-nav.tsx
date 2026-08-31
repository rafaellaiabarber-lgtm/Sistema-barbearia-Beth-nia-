"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { BarbeiroNavLink } from "./nav-links";
import { ICONES_NAV_BARBEIRO } from "./nav-icones";
import { ThemeToggle } from "../theme-toggle";
import { ValoresToggle } from "../valores-toggle";

export function BarbeiroMobileNav({
  links,
  nome,
  nomeBarbearia,
  mostrarPainelAdmin,
  logoUrl,
}: {
  links: BarbeiroNavLink[];
  nome: string;
  nomeBarbearia: string;
  mostrarPainelAdmin: boolean;
  logoUrl: string | null;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="md:hidden border-b border-orange-500/10 bg-neutral-950 relative">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={aberto}
            className="text-orange-300 hover:text-white p-1 shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-9 w-auto max-w-9 rounded-md object-contain shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-bold text-lg text-white truncate">{nomeBarbearia}</p>
            <p className="text-orange-400 text-sm">Olá, {nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ValoresToggle className="text-orange-400 hover:text-white hover:bg-orange-500/10" />
          <ThemeToggle className="text-orange-400 hover:text-white hover:bg-orange-500/10" />
        </div>
      </div>

      {aberto && (
        <nav className="absolute left-0 top-full z-10 w-64 max-h-[80vh] overflow-y-auto bg-neutral-950 border border-orange-500/10 rounded-br-xl shadow-xl flex flex-col gap-1 p-3">
          {links.map((l) => {
            const Icone = ICONES_NAV_BARBEIRO[l.icone];
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-orange-100/80 hover:bg-orange-500/10 hover:text-white"
              >
                <Icone className="w-4 h-4 shrink-0" />
                {l.label}
              </Link>
            );
          })}
          {mostrarPainelAdmin && (
            <Link
              href="/admin"
              onClick={() => setAberto(false)}
              className="rounded-lg px-3 py-2 text-sm text-orange-100/80 hover:bg-orange-500/10 hover:text-white border-t border-white/10 pt-3 mt-1"
            >
              Painel admin
            </Link>
          )}
          <form action={logout} className="border-t border-white/10 pt-2 mt-1">
            <button className="w-full text-left rounded-lg px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 hover:text-white">
              Sair
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
