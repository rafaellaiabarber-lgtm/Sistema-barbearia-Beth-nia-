"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarBarbeiro, type BarbeiroState } from "@/lib/actions/barbeiros";

const estadoInicial: BarbeiroState = {};

export function NovoBarbeiroForm() {
  const [estado, formAction, pendente] = useActionState(criarBarbeiro, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
    }
  }, [estado, pendente]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 mb-1">Nome</label>
        <input name="nome" required className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-40" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Telefone</label>
        <input name="telefone" className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-36" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Comissão (%)</label>
        <input
          name="comissao"
          type="number"
          defaultValue={50}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-20"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Usuário (login)</label>
        <input name="login" required className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-32" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Senha</label>
        <input
          name="senha"
          type="password"
          required
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-32"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Foto (opcional)</label>
        <input
          name="foto"
          type="file"
          accept="image/*"
          className="text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-slate-700 w-40"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar barbeiro"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
