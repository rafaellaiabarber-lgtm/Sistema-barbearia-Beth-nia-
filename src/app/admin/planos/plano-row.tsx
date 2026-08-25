"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Plano } from "@prisma/client";
import {
  atualizarPlano,
  alternarAtivoPlano,
  excluirPlano,
  type PlanoState,
} from "@/lib/actions/planos";
import { formatarReais } from "@/lib/format";
import { NOMES_DIAS_SEMANA, formatarDiasSemana } from "@/lib/assinaturas";
import { Valor } from "../../valor";

const estadoInicial: PlanoState = {};

export function PlanoRow({ plano }: { plano: Plano }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarPlano.bind(null, plano.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.sucesso) setEditando(false);
  }, [estado]);

  useEffect(() => {
    if (editando) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editando]);

  return (
    <div
      ref={rowRef}
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm scroll-mt-20 ${
        !plano.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={plano.nome}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full sm:w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Preço mensal (R$)</label>
            <input
              name="preco"
              required
              defaultValue={(plano.precoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Serviços/mês</label>
            <input
              name="cota"
              type="number"
              min={1}
              required
              defaultValue={plano.servicosIncluidosPorMes}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-20"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Dias que o plano cobre (deixe tudo desmarcado pra valer todo dia)
            </label>
            <div className="flex flex-wrap gap-2">
              {NOMES_DIAS_SEMANA.map((nome, i) => (
                <label
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 px-2.5 py-1.5 text-sm cursor-pointer has-[:checked]:bg-orange-50 has-[:checked]:border-orange-400 dark:has-[:checked]:bg-orange-950"
                >
                  <input
                    type="checkbox"
                    name="diasSemana"
                    value={i}
                    defaultChecked={plano.diasSemana.includes(i)}
                    className="accent-orange-600"
                  />
                  {nome}
                </label>
              ))}
            </div>
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
              <Valor>{formatarReais(plano.precoCentavos)}</Valor>/mês · {plano.servicosIncluidosPorMes} serviço(s)
              incluído(s) por mês · cobre {formatarDiasSemana(plano.diasSemana)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400"
            >
              Editar
            </button>
            <form action={alternarAtivoPlano.bind(null, plano.id, !plano.ativo)}>
              <button className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400">
                {plano.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form action={excluirPlano.bind(null, plano.id)}>
              <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
