"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro, Usuario } from "@prisma/client";
import { atualizarBarbeiro, alternarAtivoBarbeiro, excluirBarbeiro, type BarbeiroState } from "@/lib/actions/barbeiros";
import { FotoBarbeiroForm } from "./foto-barbeiro-form";

const estadoInicial: BarbeiroState = {};

export function BarbeiroRow({ barbeiro }: { barbeiro: Barbeiro & { usuario: Usuario | null } }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarBarbeiro.bind(null, barbeiro.id);
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
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm scroll-mt-20 ${
        !barbeiro.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={barbeiro.nome}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-full sm:w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
            <input
              name="telefone"
              defaultValue={barbeiro.telefone ?? ""}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Comissão (%)</label>
            <input
              name="comissao"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={barbeiro.comissaoPercentual}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-20"
            />
          </div>
          {barbeiro.usuario && (
            <>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Usuário (login)</label>
                <input
                  name="login"
                  required
                  defaultValue={barbeiro.usuario.login}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-32"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nova senha</label>
                <input
                  name="senha"
                  type="password"
                  placeholder="deixe em branco pra manter"
                  autoComplete="new-password"
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-44"
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 px-2 py-2"
          >
            Cancelar
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        </form>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <FotoBarbeiroForm barbeiroId={barbeiro.id} nome={barbeiro.nome} fotoUrl={barbeiro.fotoUrl} />
            <div>
              <p className="font-semibold">{barbeiro.nome}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {barbeiro.telefone ?? "sem telefone"} · comissão {barbeiro.comissaoPercentual}% · login:{" "}
                {barbeiro.usuario?.login}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Editar
            </button>
            <form action={alternarAtivoBarbeiro.bind(null, barbeiro.id, !barbeiro.ativo)}>
              <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                {barbeiro.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
            {!barbeiro.ativo && (
              <form
                action={excluirBarbeiro.bind(null, barbeiro.id)}
                onSubmit={(e) => {
                  if (!confirm(`Excluir ${barbeiro.nome}? Se ele já tiver atendimentos ou comissões no histórico, ele só continuará desativado.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <button type="submit" className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">
                  Excluir
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
