import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { MINIMO_CORTES_RANKING, formatarDuracao, montarRankingTempos } from "@/lib/cronometro";
import { buscarRegistros, buscarTecnicasAtivas, diasAtras } from "@/lib/cronometro-server";

const MEDALHAS = ["🥇", "🥈", "🥉"];

export default async function RankingTemposPage({
  searchParams,
}: {
  searchParams: Promise<{ tecnica?: string; periodo?: string }>;
}) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const { tecnica: tecnicaParam, periodo: periodoParam } = await searchParams;
  const periodo = periodoParam === "sempre" ? "sempre" : "30d";

  const [tecnicas, barbeiros, contagem] = await Promise.all([
    buscarTecnicasAtivas(session.barbeariaId),
    prisma.barbeiro.findMany({
      where: { barbeariaId: session.barbeariaId, ativo: true },
      select: { id: true, nome: true, fotoUrl: true },
    }),
    prisma.registroCorte.groupBy({
      by: ["tecnicaId"],
      where: { barbeariaId: session.barbeariaId },
      _count: { _all: true },
    }),
  ]);
  // Padrão: a técnica mais cronometrada na barbearia, pra não abrir num ranking vazio.
  const maisFeita = [...contagem].sort((a, b) => b._count._all - a._count._all).find((c) =>
    tecnicas.some((t) => t.id === c.tecnicaId)
  )?.tecnicaId;
  const tecnicaId = tecnicas.some((t) => t.id === tecnicaParam) ? tecnicaParam! : (maisFeita ?? tecnicas[0]?.id);

  const registros = tecnicaId
    ? await buscarRegistros(session.barbeariaId, {
        tecnicaId,
        ...(periodo === "30d" ? { desde: diasAtras(30) } : {}),
      })
    : [];
  const ranking = montarRankingTempos(registros, barbeiros);
  const href = (t: string | undefined, p: string) => `/cronometro/ranking?tecnica=${t ?? ""}&periodo=${p}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tecnicas.map((t) => (
          <Link
            key={t.id}
            href={href(t.id, periodo)}
            className={`rounded-lg px-3 py-1.5 text-sm border ${
              t.id === tecnicaId
                ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            {t.nome}
          </Link>
        ))}
      </div>
      <div className="flex gap-1 text-sm">
        {[
          { valor: "30d", label: "Últimos 30 dias" },
          { valor: "sempre", label: "Desde sempre" },
        ].map((p) => (
          <Link
            key={p.valor}
            href={href(tecnicaId, p.valor)}
            className={`rounded-full px-3 py-1 ${
              periodo === p.valor ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {ranking.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ninguém entrou no ranking ainda. É preciso ter pelo menos {MINIMO_CORTES_RANKING} cortes cronometrados dessa
          técnica no período.
        </p>
      ) : (
        <ol className="space-y-2">
          {ranking.map((l, i) => {
            const souEu = l.barbeiroId === session.barbeiroId;
            return (
              <li
                key={l.barbeiroId}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  souEu
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                }`}
              >
                <span className="w-8 text-center text-lg font-bold shrink-0">{MEDALHAS[i] ?? `${i + 1}º`}</span>
                {l.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-semibold shrink-0">
                    {l.nome.charAt(0)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {l.nome} {souEu && <span className="text-xs text-orange-600 dark:text-orange-400">(você)</span>}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {l.quantidade} cortes · melhor {formatarDuracao(l.melhor)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold tabular-nums">{formatarDuracao(l.mediaRecente)}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">média últimos 5</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        A posição é pela média dos últimos 5 cortes — um corte rápido isolado não basta, tem que manter o ritmo.
      </p>
    </div>
  );
}
