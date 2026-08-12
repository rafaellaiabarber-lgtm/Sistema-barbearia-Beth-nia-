import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { LABEL_TIPO_META, valorAtualPorTipo, type ProgressoBarbeiro } from "@/lib/metas";
import { NovaMetaForm } from "./nova-meta-form";
import { MetaCard } from "./meta-card";

export default async function MetasPage() {
  const mes = calcularIntervalo("mes", new Date());

  const [barbeiros, atendimentosMes] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: { metas: { include: { niveis: true }, orderBy: { criadoEm: "asc" } } },
    }),
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: mes.inicio, lte: mes.fim }, barbeiroId: { not: null } },
      include: { cliente: true },
    }),
  ]);

  const progressoPorBarbeiro = new Map<string, ProgressoBarbeiro>();
  for (const a of atendimentosMes) {
    const barbeiroId = a.barbeiroId!;
    const atual = progressoPorBarbeiro.get(barbeiroId) ?? {
      faturamentoCentavos: 0,
      qtdAtendimentos: 0,
      clientesNovos: 0,
    };
    atual.faturamentoCentavos += a.precoTotalCentavos;
    atual.qtdAtendimentos += 1;
    if (a.cliente && a.cliente.criadoEm >= mes.inicio && a.cliente.criadoEm <= mes.fim) {
      atual.clientesNovos += 1;
    }
    progressoPorBarbeiro.set(barbeiroId, atual);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Metas</h1>
      <p className="text-slate-500 text-sm mb-6">
        Crie metas por barbeiro com vários níveis (ex.: Bronze/Prata/Ouro) e bonificações. O progresso é calculado
        com base no mês atual.
      </p>

      <NovaMetaForm barbeiros={barbeiros} />

      <div className="space-y-6">
        {barbeiros.map((b) => {
          if (b.metas.length === 0) return null;
          const progresso = progressoPorBarbeiro.get(b.id) ?? {
            faturamentoCentavos: 0,
            qtdAtendimentos: 0,
            clientesNovos: 0,
          };
          return (
            <div key={b.id}>
              <p className="font-semibold text-slate-700 mb-2">{b.nome}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {b.metas.map((meta) => (
                  <MetaCard
                    key={meta.id}
                    metaId={meta.id}
                    barbeiroId={b.id}
                    tipo={meta.tipo}
                    ativa={meta.ativa}
                    niveis={meta.niveis}
                    valorAtual={valorAtualPorTipo(meta.tipo, progresso)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {barbeiros.every((b) => b.metas.length === 0) && (
          <p className="text-slate-400">Nenhuma meta cadastrada ainda.</p>
        )}
      </div>

      <p className="text-slate-300 text-xs mt-8">Tipos disponíveis: {Object.values(LABEL_TIPO_META).join(" · ")}</p>
    </div>
  );
}
