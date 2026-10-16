"use client";

import { useActionState } from "react";
import { cadastrarComCodigo, type FormState } from "@/lib/actions/auth";
import { BOTAO, INPUT, LABEL } from "@/components/ui";

export function CadastroForm() {
  const [estado, action, pendente] = useActionState(cadastrarComCodigo, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={LABEL}>Código do curso</label>
        <input name="codigo" required autoCapitalize="characters" className={`${INPUT} uppercase tracking-widest`} />
      </div>
      <div>
        <label className={LABEL}>Seu nome (aparece no ranking)</label>
        <input name="nome" required autoComplete="name" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Login (e-mail ou telefone)</label>
        <input name="login" required autoComplete="username" autoCapitalize="none" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Senha (mínimo 6 caracteres)</label>
        <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={INPUT} />
      </div>
      {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
      <button disabled={pendente} className={`${BOTAO} w-full`}>
        {pendente ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
