"use client";

import { useActionState, useState } from "react";
import { cadastrarBarbearia, type CadastroState } from "@/lib/actions/cadastro";

const estadoInicial: CadastroState = {};

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function CadastroForm() {
  const [estado, formAction, pendente] = useActionState(cadastrarBarbearia, estadoInicial);
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="nomeBarbearia">
          Nome da barbearia
        </label>
        <input
          id="nomeBarbearia"
          name="nomeBarbearia"
          type="text"
          required
          value={nomeBarbearia}
          onChange={(e) => {
            setNomeBarbearia(e.target.value);
            if (!slugEditadoManualmente) setSlug(slugify(e.target.value));
          }}
          className="w-full rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="slug">
          Link da sua barbearia
        </label>
        <div className="flex items-center rounded-lg border border-neutral-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
          <span className="pl-3 text-neutral-400 text-sm whitespace-nowrap">/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugEditadoManualmente(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full px-1 py-2 text-neutral-900 focus:outline-none"
          />
        </div>
        <p className="text-xs text-neutral-400 mt-1">Esse será o link do totem e da roleta da sua barbearia.</p>
      </div>

      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="nomeResponsavel">
          Seu nome
        </label>
        <input
          id="nomeResponsavel"
          name="nomeResponsavel"
          type="text"
          required
          className="w-full rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="login">
          Usuário de acesso
        </label>
        <input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-700 mb-1" htmlFor="confirmarSenha">
          Confirmar senha
        </label>
        <input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2 transition-colors"
      >
        {pendente ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
