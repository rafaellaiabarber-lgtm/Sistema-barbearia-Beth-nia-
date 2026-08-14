"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";

const estadoInicial: LoginState = {};

export function LoginForm() {
  const [estado, formAction, pendente] = useActionState(login, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-700 mb-1" htmlFor="login">
          Usuário
        </label>
        <input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-700 mb-1" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg bg-white border border-slate-300 text-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 transition-colors"
      >
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
