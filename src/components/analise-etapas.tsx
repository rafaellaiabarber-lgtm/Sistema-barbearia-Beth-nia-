import { DICA_ETAPA, LABEL_ETAPA, formatarDuracao, formatarMinutos, type AnaliseEtapas } from "@/lib/cronometro";

export function CardAnaliseEtapas({ analise, titulo }: { analise: AnaliseEtapas; titulo: string }) {
  if (analise.quantidade === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
        <p className="font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-neutral-400">
          Cronometre alguns cortes pra ver em qual etapa você perde mais tempo.
        </p>
      </div>
    );
  }

  const max = Math.max(...analise.etapas.map((e) => Math.max(e.media, e.mediaEquipe ?? 0)), 1);
  const temEquipe = analise.etapas.some((e) => e.mediaEquipe !== null);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <p className="font-semibold">{titulo}</p>
        <p className="text-xs text-neutral-400 shrink-0">
          {analise.quantidade} {analise.quantidade === 1 ? "corte" : "cortes"} · média {formatarDuracao(analise.mediaTotal)}
        </p>
      </div>

      <div className="space-y-3">
        {analise.etapas.map((e) => {
          const gargalo = e.etapa === analise.gargalo;
          return (
            <div key={e.etapa}>
              <div className="flex justify-between text-sm mb-1">
                <span className={gargalo ? "font-semibold text-orange-400" : ""}>
                  {LABEL_ETAPA[e.etapa]} {gargalo && "· maior tempo"}
                </span>
                <span className="tabular-nums">
                  {formatarDuracao(e.media)} <span className="text-neutral-400">({Math.round(e.percentual)}%)</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${gargalo ? "bg-orange-500" : "bg-neutral-500"}`}
                  style={{ width: `${(e.media / max) * 100}%` }}
                />
              </div>
              {e.mediaEquipe !== null && (
                <div className="h-1 mt-1 rounded-full bg-neutral-800 overflow-hidden" title="Média da turma">
                  <div className="h-full rounded-full bg-sky-500/70" style={{ width: `${(e.mediaEquipe / max) * 100}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {temEquipe && (
        <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded-full bg-sky-500/70" /> média da turma
        </p>
      )}

      {analise.gargalo && (
        <div className="mt-4 rounded-xl bg-orange-500/10 border border-orange-500/30 p-3 text-sm">
          <p className="font-semibold text-orange-300">
            Seu maior tempo é na {LABEL_ETAPA[analise.gargalo]}
          </p>
          <p className="text-neutral-300 mt-1">{DICA_ETAPA[analise.gargalo]}</p>
          {analise.maiorDiferencaEquipe && (
            <p className="text-neutral-300 mt-2">
              Comparando com a turma, você está {formatarMinutos(analise.maiorDiferencaEquipe.segundosAcima)} acima na{" "}
              <strong>{LABEL_ETAPA[analise.maiorDiferencaEquipe.etapa]}</strong> — é aí que tem mais tempo pra ganhar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
