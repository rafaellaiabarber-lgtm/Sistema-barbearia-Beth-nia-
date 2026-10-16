"use client";

import { useActionState, useEffect, useRef } from "react";
import { trocarSenha, type FormState } from "@/lib/actions/auth";
import { BOTAO, INPUT, LABEL } from "@/components/ui";

export function TrocarSenhaForm() {
  const [estado, action, pendente] = useActionState(trocarSenha, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className={LABEL}>Senha atual</label>
        <input name="atual" type="password" required autoComplete="current-password" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Nova senha (mínimo 6 caracteres)</label>
        <input name="nova" type="password" required minLength={6} autoComplete="new-password" className={INPUT} />
      </div>
      {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
      {estado.sucesso && <p className="text-green-400 text-sm">Senha alterada.</p>}
      <button disabled={pendente} className={`${BOTAO} w-full`}>
        {pendente ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
