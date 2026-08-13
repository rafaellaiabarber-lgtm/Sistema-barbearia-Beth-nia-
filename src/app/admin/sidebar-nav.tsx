"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import type { NavGrupo } from "./nav-links";
import { ICONES_NAV } from "./nav-icones";

export function SidebarNav({ grupos }: { grupos: NavGrupo[] }) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");
  const [colapsados, setColapsados] = useState<Record<string, boolean>>({});

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;
    return grupos
      .map((g) => ({
        ...g,
        links: g.links.filter(
          (l) => l.label.toLowerCase().includes(termo) || (g.titulo ?? "").toLowerCase().includes(termo)
        ),
      }))
      .filter((g) => g.links.length > 0);
  }, [grupos, busca]);

  function alternarGrupo(titulo: string) {
    setColapsados((atual) => ({ ...atual, [titulo]: !atual[titulo] }));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lime-300" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar opção do menu..."
          className="w-full rounded-lg bg-lime-900/50 border border-lime-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
      </div>

      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {gruposFiltrados.map((g) => {
          const temMultiplos = g.links.length > 1;
          const colapsado = !!colapsados[g.titulo ?? ""] && !busca.trim();

          if (!temMultiplos) {
            const link = g.links[0];
            const ativo = pathname === link.href;
            const Icone = ICONES_NAV[link.icone];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  ativo ? "bg-white text-lime-900" : "text-lime-100 hover:bg-lime-800/60 hover:text-white"
                }`}
              >
                <Icone className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            );
          }

          const Icone = ICONES_NAV[g.icone];
          const algumAtivo = g.links.some((l) => l.href === pathname);

          return (
            <div key={g.titulo}>
              <button
                type="button"
                onClick={() => alternarGrupo(g.titulo ?? "")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  algumAtivo && colapsado ? "bg-lime-800/60 text-white" : "text-lime-100 hover:bg-lime-800/60 hover:text-white"
                }`}
              >
                <Icone className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{g.titulo}</span>
                {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {!colapsado && (
                <div className="flex flex-col gap-1 mt-1 ml-4 pl-3 border-l border-lime-800">
                  {g.links.map((l) => {
                    const ativo = pathname === l.href;
                    const IconeLink = ICONES_NAV[l.icone];
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          ativo ? "bg-white text-lime-900 font-medium" : "text-lime-200 hover:bg-lime-800/60 hover:text-white"
                        }`}
                      >
                        <IconeLink className="w-3.5 h-3.5 shrink-0" />
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {gruposFiltrados.length === 0 && (
          <p className="text-lime-300 text-sm px-3 py-2">Nenhuma opção encontrada.</p>
        )}
      </nav>
    </div>
  );
}
