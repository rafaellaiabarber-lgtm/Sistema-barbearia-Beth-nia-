import { Award, Medal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { calcularProgressoDesafio } from "@/lib/cronometro";
import { buscarParticipantes, buscarRegistros } from "@/lib/cronometro-server";

function formatarDia(chave: string) {
  const [a, m, d] = chave.split("-");
  return `${d}/${m}/${a}`;
}

export default async function DesafiosPage() {
  const eu = await requireUsuario();

  const [desafios, registros, participantes] = await Promise.all([
    prisma.desafioCorte.findMany({
      where: { ativo: true },
      include: { tecnica: { select: { nome: true } } },
      orderBy: { criadoEm: "asc" },
    }),
    buscarRegistros(),
    buscarParticipantes(),
  ]);

  const progresso = desafios.map((d) => {
    const daTecnica = d.tecnicaId ? registros.filter((r) => r.tecnicaId === d.tecnicaId) : registros;
    const meu = calcularProgressoDesafio(
      daTecnica.filter((r) => r.usuarioId === eu.id),
      d.metaMinutos,
      d.diasSeguidos
    );
    const conquistaram = participantes.filter(
      (b) =>
        calcularProgressoDesafio(
          daTecnica.filter((r) => r.usuarioId === b.id),
          d.metaMinutos,
          d.diasSeguidos
        ).concluido
    ).length;
    return { desafio: d, meu, conquistaram };
  });

  const selos = progresso.filter((p) => p.meu.concluido);

  if (desafios.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Nenhum desafio ativo no momento. O instrutor do curso cria os desafios.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 text-white rounded-2xl p-4 shadow-lg">
        <p className="font-semibold mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" /> Seus selos ({selos.length}/{desafios.length})
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {progresso.map(({ desafio, meu }) => (
            <div key={desafio.id} className={`text-center ${meu.concluido ? "" : "opacity-30 grayscale"}`}>
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-600 flex items-center justify-center shadow">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <p className="text-[11px] leading-tight mt-1.5">{desafio.titulo}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {progresso.map(({ desafio, meu, conquistaram }) => {
          const atual = Math.min(meu.concluido ? desafio.diasSeguidos : meu.sequenciaAtual, desafio.diasSeguidos);
          const pct = (atual / desafio.diasSeguidos) * 100;
          return (
            <div
              key={desafio.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{desafio.titulo}</p>
                  <p className="text-xs text-neutral-400">
                    {desafio.diasSeguidos} dias de trabalho seguidos com média abaixo de {desafio.metaMinutos} min
                    {desafio.tecnica ? ` no ${desafio.tecnica.nome}` : " (qualquer corte)"}
                  </p>
                </div>
                {meu.concluido && (
                  <span className="shrink-0 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-semibold px-2 py-1">
                    Conquistado
                  </span>
                )}
              </div>
              <div className="mt-3 h-3 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${meu.concluido ? "bg-yellow-500" : "bg-orange-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-400 mt-1.5">
                <span>
                  {meu.concluido && meu.concluidoEm
                    ? `Conquistado em ${formatarDia(meu.concluidoEm)}`
                    : `Sequência atual: ${meu.sequenciaAtual} de ${desafio.diasSeguidos} dias`}
                </span>
                <span>
                  {conquistaram} {conquistaram === 1 ? "aluno conquistou" : "alunos conquistaram"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-neutral-400">
        Dias sem corte registrado (folga) não quebram a sequência. Um dia com média acima da meta zera a contagem.
      </p>
    </div>
  );
}
