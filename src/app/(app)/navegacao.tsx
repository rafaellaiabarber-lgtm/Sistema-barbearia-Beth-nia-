"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, ChartLine, Medal, Calculator, Trophy } from "lucide-react";

const ABAS = [
  { href: "/cronometro", label: "Cronômetro", Icone: Timer },
  { href: "/evolucao", label: "Evolução", Icone: ChartLine },
  { href: "/desafios", label: "Desafios", Icone: Medal },
  { href: "/ganho", label: "Ganho", Icone: Calculator },
  { href: "/ranking", label: "Ranking", Icone: Trophy },
];

const TITULOS: Record<string, string> = {
  "/cronometro": "Cronômetro",
  "/evolucao": "Sua evolução",
  "/desafios": "Desafios",
  "/ganho": "Calculadora de ganho",
  "/ranking": "Ranking da turma",
  "/conta": "Minha conta",
  "/instrutor": "Painel do instrutor",
  "/instrutor/alunos": "Alunos",
  "/instrutor/tecnicas": "Técnicas e desafios",
};

export function TituloPagina() {
  const pathname = usePathname();
  return <h1 className="text-xl font-bold truncate">{TITULOS[pathname] ?? ""}</h1>;
}

export function BarraInferior() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-neutral-950/95 backdrop-blur border-t border-neutral-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-xl mx-auto grid grid-cols-5">
        {ABAS.map(({ href, label, Icone }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                ativo ? "text-orange-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icone className="w-6 h-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
