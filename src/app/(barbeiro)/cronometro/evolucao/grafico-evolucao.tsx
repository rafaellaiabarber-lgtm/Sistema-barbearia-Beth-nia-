import { formatarDuracao } from "@/lib/cronometro";

const LARGURA = 600;
const ALTURA = 220;
const MARGEM = { topo: 16, direita: 12, base: 28, esquerda: 40 };

/** Linha com o tempo total de cada corte (em minutos), do mais antigo pro mais recente. */
export function GraficoEvolucao({ pontos }: { pontos: { segundosTotal: number; concluidoEm: Date }[] }) {
  if (pontos.length < 2) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Registre pelo menos 2 cortes dessa técnica pra ver o gráfico.
      </p>
    );
  }

  const minutos = pontos.map((p) => p.segundosTotal / 60);
  const maxY = Math.ceil(Math.max(...minutos) / 5) * 5;
  const minY = Math.max(Math.floor(Math.min(...minutos) / 5) * 5 - 5, 0);
  const areaL = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const areaA = ALTURA - MARGEM.topo - MARGEM.base;
  const x = (i: number) => MARGEM.esquerda + (pontos.length === 1 ? areaL / 2 : (i / (pontos.length - 1)) * areaL);
  const y = (m: number) => MARGEM.topo + (1 - (m - minY) / Math.max(maxY - minY, 1)) * areaA;

  const linhasGrade = [minY, minY + (maxY - minY) / 2, maxY];
  const caminho = minutos.map((m, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(m).toFixed(1)}`).join(" ");

  // Média móvel de 3 cortes, pra mostrar a tendência sem o "serrilhado" de cada corte.
  const movel = minutos.map((_, i) => {
    const janela = minutos.slice(Math.max(0, i - 2), i + 1);
    return janela.reduce((a, b) => a + b, 0) / janela.length;
  });
  const caminhoMovel = movel.map((m, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(m).toFixed(1)}`).join(" ");

  const fmtData = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full h-auto" role="img" aria-label="Tempo de cada corte">
        {linhasGrade.map((v) => (
          <g key={v}>
            <line
              x1={MARGEM.esquerda}
              x2={LARGURA - MARGEM.direita}
              y1={y(v)}
              y2={y(v)}
              className="stroke-neutral-200 dark:stroke-neutral-800"
              strokeWidth={1}
            />
            <text x={MARGEM.esquerda - 6} y={y(v) + 4} textAnchor="end" className="fill-neutral-400 text-[11px]">
              {Math.round(v)}m
            </text>
          </g>
        ))}
        <path d={caminho} fill="none" className="stroke-neutral-300 dark:stroke-neutral-600" strokeWidth={1.5} />
        <path d={caminhoMovel} fill="none" className="stroke-orange-500" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {minutos.map((m, i) => (
          <circle key={i} cx={x(i)} cy={y(m)} r={3.5} className="fill-orange-500">
            <title>{`${fmtData(pontos[i].concluidoEm)}: ${formatarDuracao(pontos[i].segundosTotal)}`}</title>
          </circle>
        ))}
        <text x={MARGEM.esquerda} y={ALTURA - 8} className="fill-neutral-400 text-[11px]">
          {fmtData(pontos[0].concluidoEm)}
        </text>
        <text x={LARGURA - MARGEM.direita} y={ALTURA - 8} textAnchor="end" className="fill-neutral-400 text-[11px]">
          {fmtData(pontos[pontos.length - 1].concluidoEm)}
        </text>
      </svg>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-orange-500" /> tendência (média de 3 cortes)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" /> cada corte
        </span>
      </p>
    </div>
  );
}
