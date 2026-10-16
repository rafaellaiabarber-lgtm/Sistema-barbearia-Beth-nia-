"use client";

import { useState, useTransition } from "react";
import { alternarAlunoAtivo, excluirAluno, redefinirSenhaAluno } from "@/lib/actions/alunos";

export function AlunoRow({
  aluno,
  qtdCortes,
}: {
  aluno: { id: string; nome: string; login: string; ativo: boolean };
  qtdCortes: number;
}) {
  const [pendente, startTransition] = useTransition();
  const [novaSenha, setNovaSenha] = useState<string | null>(null);

  return (
    <li className={`py-3 ${aluno.ativo ? "" : "opacity-50"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold truncate">
          {aluno.nome} {!aluno.ativo && <span className="text-xs text-red-400">(bloqueado)</span>}
        </p>
        <p className="text-xs text-neutral-500 shrink-0">{qtdCortes} cortes</p>
      </div>
      <p className="text-sm text-neutral-400 truncate">{aluno.login}</p>
      {novaSenha && (
        <p className="text-sm mt-1 text-green-300">
          Nova senha: <strong className="tracking-widest">{novaSenha}</strong> — mande pro aluno.
        </p>
      )}
      <div className="flex gap-4 mt-2 text-xs">
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            if (confirm(`Gerar uma senha nova pra ${aluno.nome}? A senha atual para de funcionar.`))
              startTransition(async () => setNovaSenha(await redefinirSenhaAluno(aluno.id)));
          }}
          className="text-orange-400 font-semibold"
        >
          Nova senha
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => alternarAlunoAtivo(aluno.id, !aluno.ativo))}
          className="text-neutral-400"
        >
          {aluno.ativo ? "Bloquear acesso" : "Liberar acesso"}
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            if (confirm(`Excluir ${aluno.nome} e todo o histórico de cortes? Isso não pode ser desfeito.`))
              startTransition(() => excluirAluno(aluno.id));
          }}
          className="text-red-400"
        >
          Excluir
        </button>
      </div>
    </li>
  );
}
