import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { buscarConfiguracao } from "@/lib/cronometro-server";
import { CARTAO } from "@/components/ui";
import { CodigoConvite, NomeCursoForm, NovoAlunoForm } from "./forms";
import { AlunoRow } from "./aluno-row";

export default async function AlunosPage() {
  await requireUsuario("INSTRUTOR");
  const [config, alunos, contagem] = await Promise.all([
    buscarConfiguracao(),
    prisma.usuario.findMany({
      where: { papel: "ALUNO" },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      select: { id: true, nome: true, login: true, ativo: true, criadoEm: true },
    }),
    prisma.registroCorte.groupBy({ by: ["usuarioId"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className={CARTAO}>
        <p className="font-semibold mb-1">Cadastrar aluno</p>
        <p className="text-sm text-neutral-400 mb-3">
          O app gera uma senha. Você manda pro aluno pelo WhatsApp e ele pode trocar depois.
        </p>
        <NovoAlunoForm />
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-1">Código do curso</p>
        <p className="text-sm text-neutral-400 mb-3">
          Com o código ligado, o próprio aluno cria a conta em “Criar minha conta”. Passe o código só pra quem comprou e
          desligue quando a turma fechar.
        </p>
        <CodigoConvite codigo={config.codigoConvite} />
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-3">
          Alunos <span className="text-neutral-500 font-normal">({alunos.length})</span>
        </p>
        {alunos.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum aluno cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {alunos.map((a) => (
              <AlunoRow
                key={a.id}
                aluno={{ id: a.id, nome: a.nome, login: a.login, ativo: a.ativo }}
                qtdCortes={contagem.find((c) => c.usuarioId === a.id)?._count._all ?? 0}
              />
            ))}
          </ul>
        )}
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-3">Nome do curso</p>
        <NomeCursoForm nomeAtual={config.nomeCurso} />
      </div>
    </div>
  );
}
