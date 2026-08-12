"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "@/lib/actions/auth";

const estadoInicial: LoginState = {};

export default function LoginPage() {
  const [estado, formAction, pendente] = useActionState(login, estadoInicial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-neutral-900 rounded-2xl shadow-xl p-8 border border-neutral-800">
        <h1 className="text-2xl font-bold text-white mb-1">Barbearia Bethânia</h1>
        <p className="text-neutral-400 mb-6">Entrar como equipe</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1" htmlFor="login">
              Usuário
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}

          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-semibold py-2 transition-colors"
          >
            {pendente ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/totem" className="text-sm text-neutral-400 hover:text-amber-400">
            Sou cliente, quero entrar na fila →
          </Link>
        </div>
      </div>
    </div>
  );
}
