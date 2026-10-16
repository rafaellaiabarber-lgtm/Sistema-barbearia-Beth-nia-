"use client";

import { useActionState } from "react";
import { entrar, type FormState } from "@/lib/actions/auth";
import { BOTAO, INPUT, LABEL } from "@/components/ui";

export function EntrarForm() {
  const [estado, action, pendente] = useActionState(entrar, {} as FormState);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className={LABEL}>Login (e-mail ou telefone)</label>
        <input name="login" required autoComplete="username" autoCapitalize="none" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Senha</label>
        <input name="senha" type="password" required autoComplete="current-password" className={INPUT} />
      </div>
      {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
      <button disabled={pendente} className={`${BOTAO} w-full`}>
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
