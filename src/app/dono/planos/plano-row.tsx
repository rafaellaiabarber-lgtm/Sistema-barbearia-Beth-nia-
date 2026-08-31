"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { PlanoPlataforma } from "@prisma/client";
import {
  atualizarPlanoPlataforma,
  alternarAtivoPlanoPlataforma,
  excluirPlanoPlataforma,
  type PlanoPlataformaState,
} from "@/lib/actions/planos-plataforma";
import { formatarReais } from "@/lib/format";

const estadoInicial: PlanoPlataformaState = {};

export function PlanoRow({ plano }: { plano: PlanoPlataforma }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarPlanoPlataforma.bind(null, plano.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente && editando) {
      setEditando(false);
    }
  }, [estado, pendente, editando]);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm ${
        !plano.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3 w-full">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={plano.nome}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-44"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Preço (R$)</label>
            <input
              name="preco"
              required
              defaultValue={(plano.precoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Período</label>
            <input
              name="periodo"
              required
              defaultValue={plano.periodo}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Link de pagamento</label>
            <input
              name="linkPagamento"
              required
              defaultValue={plano.linkPagamento}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Descrição</label>
            <input
              name="descricao"
              defaultValue={plano.descricao ?? ""}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
            />
          </div>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 px-2 py-2"
          >
            Cancelar
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        </form>
      ) : (
        <>
          <div>
            <p className="font-semibold">{plano.nome}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {formatarReais(plano.precoCentavos)} / {plano.periodo}
              {plano.descricao ? ` · ${plano.descricao}` : ""}
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1 break-all">{plano.linkPagamento}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400"
            >
              Editar
            </button>
            <form action={alternarAtivoPlanoPlataforma.bind(null, plano.id, !plano.ativo)}>
              <button className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400">
                {plano.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form
              action={excluirPlanoPlataforma.bind(null, plano.id)}
              onSubmit={(e) => {
                if (!confirm(`Excluir o plano "${plano.nome}"?`)) e.preventDefault();
              }}
            >
              <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
