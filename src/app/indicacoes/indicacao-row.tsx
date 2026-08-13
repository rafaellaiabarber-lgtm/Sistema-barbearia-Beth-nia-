"use client";

import { MessageCircle } from "lucide-react";
import { alternarContatada, alternarConvertida, excluirIndicacao } from "@/lib/actions/indicacoes";
import { formatarTelefone, linkWhatsApp } from "@/lib/format";

export function IndicacaoRow({
  id,
  nome,
  telefone,
  contatada,
  convertida,
  barbeiroNome,
  criadoEm,
}: {
  id: string;
  nome: string;
  telefone: string;
  contatada: boolean;
  convertida: boolean;
  barbeiroNome: string | null;
  criadoEm: Date;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
        contatada && !convertida ? "opacity-60" : ""
      }`}
    >
      <div>
        <p className="font-semibold">{nome}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {formatarTelefone(telefone)}
          {barbeiroNome && ` · ${barbeiroNome}`} ·{" "}
          {criadoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </p>
        <span
          className={`inline-block mt-1 rounded-full text-xs px-2 py-0.5 ${
            convertida
              ? "bg-blue-100 dark:bg-blue-900 text-blue-700"
              : contatada
                ? "bg-green-100 dark:bg-green-900 text-green-700"
                : "bg-amber-100 dark:bg-amber-900 text-amber-700"
          }`}
        >
          {convertida ? "🏆 Virou cliente" : contatada ? "Já contatada" : "Pendente"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href={linkWhatsApp(telefone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
        <form action={alternarContatada.bind(null, id, !contatada)}>
          <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600">
            {contatada ? "Marcar pendente" : "Marcar contatada"}
          </button>
        </form>
        <form action={alternarConvertida.bind(null, id, !convertida)}>
          <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600">
            {convertida ? "Desfazer conversão" : "Marcar que virou cliente"}
          </button>
        </form>
        <form action={excluirIndicacao.bind(null, id)}>
          <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Excluir</button>
        </form>
      </div>
    </div>
  );
}
