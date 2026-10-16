import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { calcularProgressoDesafio } from "@/lib/cronometro";
import { buscarParticipantes, buscarRegistros } from "@/lib/cronometro-server";
import { ModelosProntosButton, NovaTecnicaForm, NovoDesafioForm } from "./forms";
import { TecnicaCard } from "./tecnica-card";
import { DesafioRow } from "./desafio-row";

export default async function TecnicasPage() {
  await requireUsuario("INSTRUTOR");
  const [tecnicas, desafios, participantes, registros, contagemPorTecnica] = await Promise.all([
    prisma.tecnicaCorte.findMany({ orderBy: { ordem: "asc" }, include: { passos: { orderBy: { ordem: "asc" } } } }),
    prisma.desafioCorte.findMany({ orderBy: { criadoEm: "asc" }, include: { tecnica: { select: { nome: true } } } }),
    buscarParticipantes(),
    buscarRegistros(),
    prisma.registroCorte.groupBy({ by: ["tecnicaId"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Técnicas e checklist</h2>
        <p className="text-sm text-neutral-400">
          O checklist é a sequência que você ensina. O aluno vê os passos da etapa atual enquanto cronometra.
        </p>
        <ModelosProntosButton />
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
            <p className="text-neutral-500 text-sm">
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
            const conquistaram = participantes
              .filter(
                (p) =>
                  calcularProgressoDesafio(
                    daTecnica.filter((r) => r.usuarioId === p.id),
                    d.metaMinutos,
                    d.diasSeguidos
                  ).concluido
              )
              .map((p) => p.nome);
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
          {desafios.length === 0 && <p className="text-neutral-500 text-sm">Nenhum desafio criado.</p>}
        </div>
      </section>
    </div>
  );
}
