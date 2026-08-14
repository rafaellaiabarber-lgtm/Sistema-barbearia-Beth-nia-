"use client";

import { useActionState } from "react";
import { atualizarConfiguracaoRanking, type ConfiguracaoRankingState } from "@/lib/actions/ranking";

const estadoInicial: ConfiguracaoRankingState = {};

export function RankingConfigForm({
  pontosPorAtendimento,
  pontosPorVendaProduto,
  pontosPorAssinatura,
  pontosPorIndicacaoConvertida,
  premio1LugarSemanal,
  premio2LugarSemanal,
  premio3LugarSemanal,
  premio1LugarMensal,
  premio2LugarMensal,
  premio3LugarMensal,
  pontuacaoMinimaPremio,
}: {
  pontosPorAtendimento: number;
  pontosPorVendaProduto: number;
  pontosPorAssinatura: number;
  pontosPorIndicacaoConvertida: number;
  premio1LugarSemanal: string | null;
  premio2LugarSemanal: string | null;
  premio3LugarSemanal: string | null;
  premio1LugarMensal: string | null;
  premio2LugarMensal: string | null;
  premio3LugarMensal: string | null;
  pontuacaoMinimaPremio: number | null;
}) {
  const [estado, formAction, pendente] = useActionState(atualizarConfiguracaoRanking, estadoInicial);

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">
        Configurar pontos e premiação
      </summary>
      <form action={formAction} className="mt-4 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Quantos pontos vale cada ação</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            "Serviço extra" conta só os serviços marcados como "Conta no ranking" lá em Serviços — dá pra desmarcar corte,
            barba etc. e deixar só as extras (hidratação, sobrancelha...) valendo ponto.
          </p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Serviço extra realizado</label>
              <input
                name="pontosPorAtendimento"
                type="number"
                min={0}
                defaultValue={pontosPorAtendimento}
                className="w-24 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Produto vendido</label>
              <input
                name="pontosPorVendaProduto"
                type="number"
                min={0}
                defaultValue={pontosPorVendaProduto}
                className="w-24 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Assinatura vendida</label>
              <input
                name="pontosPorAssinatura"
                type="number"
                min={0}
                defaultValue={pontosPorAssinatura}
                className="w-24 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Indicação convertida</label>
              <input
                name="pontosPorIndicacaoConvertida"
                type="number"
                min={0}
                defaultValue={pontosPorIndicacaoConvertida}
                className="w-24 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Prêmio semanal (opcional)</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Pode ser um valor (ex: R$ 100,00) ou qualquer coisa escrita (ex: Um dia de folga, Vale-presente).
          </p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥇 1º lugar</label>
              <input
                name="premio1LugarSemanal"
                placeholder="sem prêmio"
                defaultValue={premio1LugarSemanal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥈 2º lugar</label>
              <input
                name="premio2LugarSemanal"
                placeholder="sem prêmio"
                defaultValue={premio2LugarSemanal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥉 3º lugar</label>
              <input
                name="premio3LugarSemanal"
                placeholder="sem prêmio"
                defaultValue={premio3LugarSemanal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Prêmio mensal (opcional)</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥇 1º lugar</label>
              <input
                name="premio1LugarMensal"
                placeholder="sem prêmio"
                defaultValue={premio1LugarMensal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥈 2º lugar</label>
              <input
                name="premio2LugarMensal"
                placeholder="sem prêmio"
                defaultValue={premio2LugarMensal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">🥉 3º lugar</label>
              <input
                name="premio3LugarMensal"
                placeholder="sem prêmio"
                defaultValue={premio3LugarMensal ?? ""}
                className="w-40 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Pontuação mínima pra valer o prêmio</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Se o 1º/2º/3º lugar não bater esse mínimo de pontos no período, o prêmio não é mostrado pra ele. Vale pro
            semanal, mensal e pro período personalizado (que usa o mesmo prêmio semanal). Deixa em branco pra não ter
            mínimo.
          </p>
          <input
            name="pontuacaoMinimaPremio"
            type="number"
            min={0}
            placeholder="sem mínimo"
            defaultValue={pontuacaoMinimaPremio ?? ""}
            className="w-32 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
          >
            {pendente ? "Salvando..." : "Salvar configuração"}
          </button>
          {estado.sucesso && <p className="text-green-600 text-sm">Configuração salva!</p>}
          {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}
        </div>
      </form>
    </details>
  );
}
