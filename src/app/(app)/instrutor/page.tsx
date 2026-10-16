import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { analisarEtapas, calcularEvolucao, formatarDuracao, formatarMinutos, LABEL_ETAPA } from "@/lib/cronometro";
import { buscarRegistros, diasAtras } from "@/lib/cronometro-server";
import { CARTAO } from "@/components/ui";
import { CopiarLink } from "./copiar-link";

export default async function InstrutorPage() {
  await requireUsuario("INSTRUTOR");
  const [alunos, registros, qtdTecnicas] = await Promise.all([
    prisma.usuario.findMany({ where: { papel: "ALUNO", ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    buscarRegistros(),
    prisma.tecnicaCorte.count({ where: { ativo: true } }),
  ]);

  const desde = diasAtras(30).getTime();
  const linhas = alunos
    .map((a) => {
      const todos = registros.filter((r) => r.usuarioId === a.id);
      const recentes = todos.filter((r) => r.concluidoEm.getTime() >= desde);
      return {
        ...a,
        analise: analisarEtapas(recentes),
        evolucao: calcularEvolucao(todos),
        ultimo: todos.at(-1)?.concluidoEm ?? null,
      };
    })
    .sort((a, b) => (b.ultimo?.getTime() ?? 0) - (a.ultimo?.getTime() ?? 0));

  const ativos30 = linhas.filter((l) => l.analise.quantidade > 0).length;
  const cortes30 = registros.filter((r) => r.concluidoEm.getTime() >= desde).length;

  // Etapa que mais pesa na turma: bom tema pra próxima aula.
  const turma = analisarEtapas(registros.filter((r) => r.concluidoEm.getTime() >= desde));

  return (
    <div className="space-y-4">
      {qtdTecnicas === 0 && (
        <div className="rounded-2xl border border-orange-500/50 bg-orange-500/10 p-4 text-sm">
          <p className="font-semibold text-orange-300">Primeiro passo: cadastre as técnicas</p>
          <p className="text-neutral-300 mt-1">
            Sem técnicas o aluno não consegue cronometrar.{" "}
            <Link href="/instrutor/tecnicas" className="text-orange-400 font-semibold">
              Usar modelos prontos →
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Alunos", valor: alunos.length },
          { label: "Ativos (30d)", valor: ativos30 },
          { label: "Cortes (30d)", valor: cortes30 },
        ].map((k) => (
          <div key={k.label} className={CARTAO}>
            <p className="text-xs text-neutral-400">{k.label}</p>
            <p className="text-2xl font-bold">{k.valor}</p>
          </div>
        ))}
      </div>

      {turma.gargalo && (
        <div className={CARTAO}>
          <p className="text-sm text-neutral-400">Etapa que mais pesa na turma (30 dias)</p>
          <p className="text-lg font-bold text-orange-400">
            {LABEL_ETAPA[turma.gargalo]} ·{" "}
            {Math.round(turma.etapas.find((e) => e.etapa === turma.gargalo)!.percentual)}% do tempo
          </p>
          <p className="text-xs text-neutral-500 mt-1">Bom tema pra próxima aula ou vídeo.</p>
        </div>
      )}

      <div className={CARTAO}>
        <p className="font-semibold mb-1">Calculadora pública (pra divulgar o curso)</p>
        <p className="text-sm text-neutral-400 mb-3">
          Página aberta, sem login: o barbeiro coloca o tempo e o valor do corte dele e vê quanto ganharia a mais.
        </p>
        <CopiarLink caminho="/calculadora" />
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-3">Alunos</p>
        {linhas.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Nenhum aluno ainda.{" "}
            <Link href="/instrutor/alunos" className="text-orange-400 font-semibold">
              Cadastrar alunos →
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {linhas.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold truncate">{l.nome}</p>
                  <p className="text-xs text-neutral-500 shrink-0">
                    {l.ultimo ? `último corte ${l.ultimo.toLocaleDateString("pt-BR")}` : "nunca cronometrou"}
                  </p>
                </div>
                {l.analise.quantidade > 0 && (
                  <p className="text-sm text-neutral-400 mt-0.5">
                    {l.analise.quantidade} cortes · média {formatarDuracao(l.analise.mediaTotal)} · perde mais na{" "}
                    <span className="text-orange-300">{LABEL_ETAPA[l.analise.gargalo!]}</span>
                    {l.evolucao && l.evolucao.diferenca >= 60 && (
                      <span className="text-green-400"> · −{formatarMinutos(l.evolucao.diferenca)} desde o início</span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
