import type { PosicaoRanking, PremiosPeriodo } from "@/lib/ranking";
import { premioPorPosicao } from "@/lib/ranking";

const MEDALHA: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function RankingLista({
  ranking,
  premios,
  pontuacaoMinima = null,
}: {
  ranking: PosicaoRanking[];
  premios: PremiosPeriodo;
  pontuacaoMinima?: number | null;
}) {
  if (ranking.length === 0) {
    return (
      <p className="text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
        Nenhum barbeiro ativo ainda.
      </p>
    );
  }

  const podio = ranking.slice(0, 3);
  const resto = ranking.slice(3);
  const temPremioConfigurado = premios.premio1 !== null || premios.premio2 !== null || premios.premio3 !== null;

  return (
    <div>
      {temPremioConfigurado && pontuacaoMinima !== null && (
        <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-2">
          Prêmio só vale a partir de {pontuacaoMinima} pontos.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {podio.map((p) => {
          const premioConfiguradoParaPosicao = premioPorPosicao(p.posicao, Infinity, premios, null);
          const premio = premioPorPosicao(p.posicao, p.pontos, premios, pontuacaoMinima);
          const abaixoDoMinimo =
            premioConfiguradoParaPosicao !== null && pontuacaoMinima !== null && p.pontos < pontuacaoMinima;
          return (
            <div
              key={p.barbeiroId}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm text-center"
            >
              <p className="text-3xl mb-1">{MEDALHA[p.posicao]}</p>
              <p className="font-semibold">{p.nome}</p>
              <p className="text-orange-600 dark:text-orange-400 font-bold text-lg">{p.pontos} pts</p>
              {premio !== null && (
                <p className="text-green-600 text-xs font-medium mt-1">Prêmio: {premio}</p>
              )}
              {abaixoDoMinimo && (
                <p className="text-amber-600 text-xs font-medium mt-1">
                  Faltam {pontuacaoMinima - p.pontos} pts pro prêmio
                </p>
              )}
            </div>
          );
        })}
      </div>

      {resto.length > 0 && (
        <div className="space-y-1.5">
          {resto.map((p) => (
            <div
              key={p.barbeiroId}
              className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 shadow-sm"
            >
              <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                {p.posicao}º · {p.nome}
              </span>
              <span className="text-neutral-700 dark:text-neutral-200 font-semibold text-sm">{p.pontos} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
