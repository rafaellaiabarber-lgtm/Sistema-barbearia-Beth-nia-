import Link from "next/link";
import { TrendingDown } from "lucide-react";
import { requireUsuario } from "@/lib/session";
import { analisarEtapas, calcularEvolucao, formatarDuracao, formatarMinutos } from "@/lib/cronometro";
import { buscarRegistros, buscarTecnicasAtivas } from "@/lib/cronometro-server";
import { CardAnaliseEtapas } from "@/components/analise-etapas";
import { GraficoEvolucao } from "./grafico-evolucao";
import { ExcluirCorteButton } from "@/components/excluir-corte-button";

export default async function EvolucaoPage({ searchParams }: { searchParams: Promise<{ tecnica?: string }> }) {
  const eu = await requireUsuario();
  const { tecnica: tecnicaParam } = await searchParams;

  const [tecnicas, todosMeus] = await Promise.all([buscarTecnicasAtivas(), buscarRegistros({ usuarioId: eu.id })]);

  // Técnicas com corte registrado primeiro; padrão = a que ele mais fez.
  const contagem = new Map<string, number>();
  for (const r of todosMeus) if (r.tecnicaId) contagem.set(r.tecnicaId, (contagem.get(r.tecnicaId) ?? 0) + 1);
  const maisFeita = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const tecnicaId = tecnicas.some((t) => t.id === tecnicaParam) ? tecnicaParam! : (maisFeita ?? tecnicas[0]?.id);
  const tecnica = tecnicas.find((t) => t.id === tecnicaId);

  const registros = todosMeus.filter((r) => r.tecnicaId === tecnicaId);
  const turma = tecnicaId ? await buscarRegistros({ tecnicaId }) : [];
  const evolucao = calcularEvolucao(registros);
  const recentes = [...registros].reverse().slice(0, 15);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {tecnicas.map((t) => (
          <Link
            key={t.id}
            href={`/evolucao?tecnica=${t.id}`}
            className={`rounded-lg px-3 py-1.5 text-sm border ${
              t.id === tecnicaId
                ? "border-orange-500 bg-orange-500/10 text-orange-300 font-semibold"
                : "border-neutral-800"
            }`}
          >
            {t.nome} <span className="text-neutral-400">({contagem.get(t.id) ?? 0})</span>
          </Link>
        ))}
      </div>

      {evolucao && tecnica && (
        <div
          className={`rounded-2xl p-4 border ${
            evolucao.diferenca > 0 ? "bg-green-500/10 border-green-500/40" : "bg-neutral-900 border-neutral-800"
          }`}
        >
          {evolucao.diferenca >= 60 ? (
            <p className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-green-600" />
              Seu {tecnica.nome} caiu de {formatarMinutos(evolucao.inicio)} para {formatarMinutos(evolucao.atual)}
            </p>
          ) : (
            <p className="text-lg font-bold">
              Seu {tecnica.nome} está em {formatarMinutos(evolucao.atual)} em média
            </p>
          )}
          <p className="text-sm text-neutral-300 mt-1">
            {evolucao.diferenca >= 60
              ? `São ${formatarMinutos(evolucao.diferenca)} a menos por corte. `
              : "Continue cronometrando — a evolução aparece com a repetição. "}
            Melhor tempo: <strong>{formatarDuracao(evolucao.melhor)}</strong>.
          </p>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
        <p className="font-semibold mb-3">Tempo por corte{tecnica ? ` · ${tecnica.nome}` : ""}</p>
        <GraficoEvolucao pontos={registros.slice(-40)} />
      </div>

      <CardAnaliseEtapas
        analise={analisarEtapas(registros, turma.filter((r) => r.usuarioId !== eu.id))}
        titulo={`Etapas${tecnica ? ` · ${tecnica.nome}` : ""}`}
      />

      {recentes.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <p className="font-semibold mb-2">Últimos cortes</p>
          <ul className="divide-y divide-neutral-800">
            {recentes.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-neutral-400 w-24 shrink-0">
                  {r.concluidoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
                  {r.concluidoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-semibold tabular-nums">{formatarDuracao(r.segundosTotal)}</span>
                <span className="flex-1 text-xs text-neutral-400 tabular-nums truncate">
                  {formatarDuracao(r.segundosMaquina)} · {formatarDuracao(r.segundosTransicao)} ·{" "}
                  {formatarDuracao(r.segundosAcabamento)} · {formatarDuracao(r.segundosFinalizacao)}
                </span>
                <ExcluirCorteButton id={r.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
