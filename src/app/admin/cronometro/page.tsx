import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { analisarEtapas, calcularProgressoDesafio, formatarDuracao, LABEL_ETAPA } from "@/lib/cronometro";
import { buscarRegistros, diasAtras } from "@/lib/cronometro-server";
import { ModelosProntosButton, NovaTecnicaForm, NovoDesafioForm } from "./forms";
import { TecnicaCard } from "./tecnica-card";
import { DesafioRow } from "./desafio-row";

export default async function CronometroAdminPage() {
  const session = await requireSession(["ADMIN"]);
  const barbeariaId = session.barbeariaId;

  const [tecnicas, desafios, barbeiros, registros, contagemPorTecnica] = await Promise.all([
    prisma.tecnicaCorte.findMany({
      where: { barbeariaId },
      orderBy: { ordem: "asc" },
      include: { passos: { orderBy: { ordem: "asc" } } },
    }),
    prisma.desafioCorte.findMany({
      where: { barbeariaId },
      orderBy: { criadoEm: "asc" },
      include: { tecnica: { select: { nome: true } } },
    }),
    prisma.barbeiro.findMany({ where: { barbeariaId, ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    buscarRegistros(barbeariaId),
    prisma.registroCorte.groupBy({ by: ["tecnicaId"], where: { barbeariaId }, _count: { _all: true } }),
  ]);

  const desde = diasAtras(30).getTime();
  const recentes = registros.filter((r) => r.concluidoEm.getTime() >= desde);
  const equipe = barbeiros.map((b) => {
    const meus = recentes.filter((r) => r.barbeiroId === b.id);
    return { ...b, analise: analisarEtapas(meus) };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Cronômetro de corte</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Cadastre as técnicas com o checklist que você ensina, crie desafios e acompanhe onde cada barbeiro perde
          tempo. Os barbeiros usam em{" "}
          <Link href="/cronometro" className="text-orange-600 dark:text-orange-400 hover:underline">
            /cronometro
          </Link>{" "}
          — no celular, dá pra instalar como app pela opção “Adicionar à tela inicial”.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Equipe nos últimos 30 dias</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <thead className="text-xs text-neutral-500 dark:text-neutral-400 text-left">
              <tr>
                <th className="p-3">Barbeiro</th>
                <th className="p-3">Cortes</th>
                <th className="p-3">Média</th>
                <th className="p-3">Onde perde mais tempo</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((b) => (
                <tr key={b.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3 font-medium">{b.nome}</td>
                  <td className="p-3">{b.analise.quantidade}</td>
                  <td className="p-3 tabular-nums">{b.analise.quantidade ? formatarDuracao(b.analise.mediaTotal) : "—"}</td>
                  <td className="p-3">
                    {b.analise.gargalo
                      ? `${LABEL_ETAPA[b.analise.gargalo]} (${Math.round(
                          b.analise.etapas.find((e) => e.etapa === b.analise.gargalo)!.percentual
                        )}%)`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Técnicas e checklist</h2>
          <ModelosProntosButton />
        </div>
        <NovaTecnicaForm />
        <div className="space-y-2">
          {tecnicas.map((t) => (
            <TecnicaCard
              key={t.id}
              tecnica={{
                id: t.id,
                nome: t.nome,
                ativo: t.ativo,
                passos: t.passos.map((p) => ({ id: p.id, etapa: p.etapa, texto: p.texto })),
              }}
              qtdCortes={contagemPorTecnica.find((c) => c.tecnicaId === t.id)?._count._all ?? 0}
            />
          ))}
          {tecnicas.length === 0 && (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm">
              Nenhuma técnica ainda. Use os modelos prontos pra começar rápido e ajuste o checklist do seu jeito.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Desafios</h2>
        <NovoDesafioForm tecnicas={tecnicas.filter((t) => t.ativo).map((t) => ({ id: t.id, nome: t.nome }))} />
        <div className="space-y-2">
          {desafios.map((d) => {
            const daTecnica = d.tecnicaId ? registros.filter((r) => r.tecnicaId === d.tecnicaId) : registros;
            const conquistaram = barbeiros
              .filter(
                (b) =>
                  calcularProgressoDesafio(
                    daTecnica.filter((r) => r.barbeiroId === b.id),
                    d.metaMinutos,
                    d.diasSeguidos
                  ).concluido
              )
              .map((b) => b.nome);
            return (
              <DesafioRow
                key={d.id}
                desafio={{
                  id: d.id,
                  titulo: d.titulo,
                  metaMinutos: d.metaMinutos,
                  diasSeguidos: d.diasSeguidos,
                  ativo: d.ativo,
                  tecnicaNome: d.tecnica?.nome ?? null,
                }}
                conquistaram={conquistaram}
              />
            );
          })}
          {desafios.length === 0 && <p className="text-neutral-400 dark:text-neutral-500 text-sm">Nenhum desafio criado.</p>}
        </div>
      </section>
    </div>
  );
}
