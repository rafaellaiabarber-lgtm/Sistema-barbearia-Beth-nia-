"use client";

import { MessageCircle } from "lucide-react";
import { formatarTelefone, linkWhatsApp } from "@/lib/format";

export function ClienteAvaliacaoRow({
  nome,
  telefone,
  barbeiroNome,
  servicos,
  minutosAtras,
}: {
  nome: string;
  telefone: string;
  barbeiroNome: string;
  servicos: string[];
  minutosAtras: number;
}) {
  const primeiroNome = nome.split(" ")[0];
  const mensagem = encodeURIComponent(
    `Oi, ${primeiroNome}! Aqui é da Barbearia Bethânia. Como foi o atendimento de hoje (${servicos.join(" + ")}) com o ${barbeiroNome}? A sua opinião é muito importante pra gente! 💈🙏`
  );

  const tempoTexto =
    minutosAtras < 60 ? `há ${minutosAtras} min` : `há ${Math.floor(minutosAtras / 60)}h${minutosAtras % 60 || ""}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div>
        <p className="font-semibold">{nome}</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {formatarTelefone(telefone)} · {servicos.join(", ")} com {barbeiroNome} · concluído {tempoTexto}
        </p>
      </div>
      <a
        href={`${linkWhatsApp(telefone)}?text=${mensagem}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2"
      >
        <MessageCircle className="w-4 h-4" />
        Pedir avaliação no WhatsApp
      </a>
    </div>
  );
}
