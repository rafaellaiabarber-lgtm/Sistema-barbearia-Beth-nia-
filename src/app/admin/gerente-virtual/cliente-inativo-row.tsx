"use client";

import { MessageCircle } from "lucide-react";
import { formatarTelefone, linkWhatsApp } from "@/lib/format";

export function ClienteInativoRow({
  nome,
  telefone,
  diasSemVoltar,
  qtdVisitas,
}: {
  nome: string;
  telefone: string;
  diasSemVoltar: number;
  qtdVisitas: number;
}) {
  const mensagem = encodeURIComponent(
    `Fala, ${nome.split(" ")[0]}! Já faz um tempinho desde seu último corte na Barbearia Bethânia. Que tal dar aquela renovada no visual essa semana? 💈`
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div>
        <p className="font-semibold">{nome}</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {formatarTelefone(telefone)} · sem voltar há {diasSemVoltar} dias · {qtdVisitas} visita(s) no total
        </p>
      </div>
      <a
        href={`${linkWhatsApp(telefone)}?text=${mensagem}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2"
      >
        <MessageCircle className="w-4 h-4" />
        Chamar no WhatsApp
      </a>
    </div>
  );
}
