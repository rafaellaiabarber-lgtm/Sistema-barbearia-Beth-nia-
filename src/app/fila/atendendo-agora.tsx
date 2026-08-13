"use client";

import { useEffect, useState } from "react";
import type { Servico } from "@prisma/client";
import { desfazerInicioAtendimento } from "@/lib/actions/fila";
import { itemCompleto, type ItemProgresso } from "@/lib/campanhas";
import { ConcluirForm } from "./concluir-form";

function formatarDuracao(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function AtendendoAgora({
  atendimentoId,
  clienteNome,
  chamadoEm,
  servicos,
  campanhas,
  comAvisoFixo,
  planoAtivo,
}: {
  atendimentoId: string;
  clienteNome: string;
  chamadoEm: Date;
  servicos: Servico[];
  campanhas: { id: string; titulo: string | null; itens: ItemProgresso[] }[];
  comAvisoFixo?: boolean;
  planoAtivo: string | null;
}) {
  const [agora, setAgora] = useState(() => Date.now());
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const segundos = Math.max(0, Math.floor((agora - chamadoEm.getTime()) / 1000));
  const horaInicio = chamadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (finalizando) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center px-4 ${comAvisoFixo ? "pb-16" : ""}`}>
        <div className="w-full max-w-md">
          <p className="text-slate-500 dark:text-slate-400 text-center mb-4">
            Finalizando atendimento de <span className="font-semibold text-slate-900 dark:text-white">{clienteNome}</span>
          </p>
          {planoAtivo && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-xl p-3 mb-4 text-center">
              <p className="text-amber-900 dark:text-amber-100 text-sm font-semibold">
                🎫 Este cliente tem o plano {planoAtivo} ativo
              </p>
              <p className="text-amber-800 dark:text-amber-200 text-xs mt-1">
                Confirme se é mesmo um corte avulso antes de cobrar.
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <ConcluirForm atendimentoId={atendimentoId} servicos={servicos} />
          </div>
          <button
            type="button"
            onClick={() => setFinalizando(false)}
            className="mt-4 w-full text-center text-slate-500 dark:text-slate-400 hover:text-slate-800 text-sm"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center text-center px-4 ${comAvisoFixo ? "pb-16" : ""}`}>
      <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">Atendendo agora</p>
      <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">{clienteNome}</p>
      {planoAtivo && (
        <p className="inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1 mb-2">
          🎫 Assinante — plano {planoAtivo}
        </p>
      )}
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Iniciado às {horaInicio}</p>
      <p className="text-3xl font-bold text-blue-600 mb-8 tabular-nums">{formatarDuracao(segundos)}</p>

      {campanhas.map((c) => (
        <div
          key={c.id}
          className="w-full max-w-sm bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-xl p-4 mb-6 text-left"
        >
          <p className="text-amber-800 font-semibold text-sm mb-2">
            💡 {c.titulo ? c.titulo : "Aproveita e ofereça:"}
          </p>
          <ul className="space-y-1">
            {c.itens.map((item) => {
              const feito = itemCompleto(item);
              return (
                <li
                  key={item.itemId}
                  className={`flex items-center justify-between text-sm ${feito ? "text-green-700 dark:text-green-400 line-through" : "text-amber-900 dark:text-amber-100"}`}
                >
                  <span>{feito ? "✓ " : ""}{item.nome}</span>
                  <span className="font-semibold tabular-nums">
                    {item.quantidadeAtual}/{item.quantidadeAlvo}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setFinalizando(true)}
        className="w-full max-w-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 mb-3 transition-colors"
      >
        Finalizar atendimento
      </button>

      <form action={desfazerInicioAtendimento.bind(null, atendimentoId)}>
        <button type="submit" className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm">
          Desfazer início
        </button>
      </form>
    </div>
  );
}
