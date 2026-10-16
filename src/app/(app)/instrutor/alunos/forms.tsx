"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import {
  criarAluno,
  desativarCodigoConvite,
  gerarCodigoConvite,
  salvarNomeCurso,
  type CriarAlunoState,
} from "@/lib/actions/alunos";
import type { FormState } from "@/lib/actions/auth";
import { BOTAO, INPUT, LABEL } from "@/components/ui";
import { CopiarLink } from "../copiar-link";

export function NovoAlunoForm() {
  const [estado, action, pendente] = useActionState(criarAluno, {} as CriarAlunoState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado]);

  return (
    <div className="space-y-3">
      <form ref={formRef} action={action} className="space-y-3">
        <div>
          <label className={LABEL}>Nome (aparece no ranking)</label>
          <input name="nome" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Login (e-mail ou telefone)</label>
          <input name="login" required autoCapitalize="none" className={INPUT} />
        </div>
        {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
        <button disabled={pendente} className={`${BOTAO} w-full`}>
          {pendente ? "Cadastrando..." : "Cadastrar aluno"}
        </button>
      </form>
      {estado.sucesso && estado.senhaGerada && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm space-y-2">
          <p className="font-semibold text-green-300">Aluno cadastrado! Mande esse acesso pra ele:</p>
          <p>
            Login: <strong>{estado.login}</strong>
            <br />
            Senha: <strong className="tracking-widest">{estado.senhaGerada}</strong>
          </p>
          <CopiarLink
            caminho="/entrar"
            texto={(url) =>
              `Seu acesso ao app do curso:\n${url}\nLogin: ${estado.login}\nSenha: ${estado.senhaGerada}\n\nNo celular, abra o link e use "Adicionar à tela inicial" pra instalar.`
            }
          />
        </div>
      )}
    </div>
  );
}

export function CodigoConvite({ codigo }: { codigo: string | null }) {
  const [pendente, startTransition] = useTransition();
  if (!codigo) {
    return (
      <button
        type="button"
        disabled={pendente}
        onClick={() => startTransition(() => gerarCodigoConvite())}
        className={`${BOTAO} w-full`}
      >
        {pendente ? "Gerando..." : "Ligar código do curso"}
      </button>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-center text-3xl font-bold tracking-[0.3em] text-orange-300">{codigo}</p>
      <CopiarLink
        caminho="/cadastro"
        texto={(url) => `Crie sua conta no app do curso:\n${url}\nCódigo do curso: ${codigo}`}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            if (confirm("Gerar um código novo? O código atual para de funcionar.")) startTransition(() => gerarCodigoConvite());
          }}
          className="rounded-xl border border-neutral-700 py-2.5 text-sm font-semibold"
        >
          Gerar outro
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => desativarCodigoConvite())}
          className="rounded-xl border border-red-500/50 text-red-300 py-2.5 text-sm font-semibold"
        >
          Desligar
        </button>
      </div>
    </div>
  );
}

export function NomeCursoForm({ nomeAtual }: { nomeAtual: string }) {
  const [estado, action, pendente] = useActionState(salvarNomeCurso, {} as FormState);
  return (
    <form action={action} className="flex gap-2">
      <input name="nomeCurso" required defaultValue={nomeAtual} className={INPUT} />
      <button disabled={pendente} className={BOTAO}>
        Salvar
      </button>
      {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
    </form>
  );
}
