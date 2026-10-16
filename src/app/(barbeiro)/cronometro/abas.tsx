"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, ChartLine, Medal, Calculator, Trophy } from "lucide-react";

const ABAS = [
  { href: "/cronometro", label: "Cronômetro", Icone: Timer },
  { href: "/cronometro/evolucao", label: "Evolução", Icone: ChartLine },
  { href: "/cronometro/desafios", label: "Desafios", Icone: Medal },
  { href: "/cronometro/ganho", label: "Ganho", Icone: Calculator },
  { href: "/cronometro/ranking", label: "Ranking", Icone: Trophy },
];

export function AbasCronometro() {
  const pathname = usePathname();
  return (
    <nav className="grid grid-cols-5 gap-1 sm:flex">
      {ABAS.map(({ href, label, Icone }) => {
        const ativo = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 rounded-xl sm:rounded-full px-1 sm:px-3 py-1.5 text-[11px] sm:text-sm font-medium transition-colors ${
              ativo
                ? "bg-orange-600 text-white"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500"
            }`}
          >
            <Icone className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
