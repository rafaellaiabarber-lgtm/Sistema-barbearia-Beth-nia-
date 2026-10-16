"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  adicionarPasso,
  alternarTecnicaAtiva,
  excluirPasso,
  excluirTecnica,
  moverPasso,
  renomearTecnica,
  type CronometroAdminState,
} from "@/lib/actions/cronometro";
import { ETAPAS, LABEL_ETAPA, type EtapaCorte } from "@/lib/cronometro";

type Passo = { id: string; etapa: EtapaCorte; texto: string };

const estadoInicial: CronometroAdminState = {};

export function TecnicaCard({
  tecnica,
  qtdCortes,
}: {
  tecnica: { id: string; nome: string; ativo: boolean; passos: Passo[] };
  qtdCortes: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(tecnica.nome);
  const [pendente, startTransition] = useTransition();
  const [estado, formAction, adicionando] = useActionState(adicionarPasso.bind(null, tecnica.id), estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      const etapa = (formRef.current?.elements.namedItem("etapa") as HTMLSelectElement | null)?.value;
      formRef.current?.reset();
      // Mantém a etapa escolhida pra cadastrar vários passos seguidos da mesma fase.
      const select = formRef.current?.elements.namedItem("etapa") as HTMLSelectElement | null;
      if (select && etapa) select.value = etapa;
    }
  }, [estado]);

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm ${
        tecnica.ativo ? "" : "opacity-60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {editandoNome ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await renomearTecnica(tecnica.id, nome);
                setEditandoNome(false);
              });
            }}
          >
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1 text-sm"
            />
            <button className="text-sm text-orange-600 font-semibold">Salvar</button>
          </form>
        ) : (
          <button type="button" onClick={() => setAberto((v) => !v)} className="font-semibold text-left flex-1 min-w-0">
            {tecnica.nome}{" "}
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              · {tecnica.passos.length} passos · {qtdCortes} cortes registrados {tecnica.ativo ? "" : "· inativa"}
            </span>
          </button>
        )}
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setAberto((v) => !v)} className="text-orange-600 dark:text-orange-400 font-semibold">
            {aberto ? "Fechar" : "Checklist"}
          </button>
          <button type="button" onClick={() => setEditandoNome((v) => !v)} className="text-neutral-500 hover:underline">
            Renomear
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => startTransition(() => alternarTecnicaAtiva(tecnica.id, !tecnica.ativo))}
            className="text-neutral-500 hover:underline"
          >
            {tecnica.ativo ? "Desativar" : "Ativar"}
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => {
              if (confirm(`Excluir "${tecnica.nome}"? Os cortes já registrados continuam no histórico.`))
                startTransition(() => excluirTecnica(tecnica.id));
            }}
            className="text-red-600 hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>

      {aberto && (
        <div className="mt-4 space-y-4">
          {ETAPAS.map((etapa) => {
            const passos = tecnica.passos.filter((p) => p.etapa === etapa);
            return (
              <div key={etapa}>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                  {LABEL_ETAPA[etapa]}
                </p>
                {passos.length === 0 && <p className="text-sm text-neutral-400">Nenhum passo.</p>}
                <ol className="space-y-1">
                  {passos.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1.5">
                      <span className="text-neutral-400 w-5 shrink-0">{i + 1}.</span>
                      <span className="flex-1">{p.texto}</span>
                      <button
                        type="button"
                        disabled={pendente || i === 0}
                        aria-label="Subir"
                        onClick={() => startTransition(() => moverPasso(p.id, "cima"))}
                        className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pendente || i === passos.length - 1}
                        aria-label="Descer"
                        onClick={() => startTransition(() => moverPasso(p.id, "baixo"))}
                        className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pendente}
                        aria-label="Excluir passo"
                        onClick={() => startTransition(() => excluirPasso(p.id))}
                        className="text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}

          <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <select
              name="etapa"
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            >
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {LABEL_ETAPA[e]}
                </option>
              ))}
            </select>
            <input
              name="texto"
              required
              placeholder="Ex.: Pente 1 abrindo a alavanca"
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm flex-1 min-w-48"
            />
            <button
              type="submit"
              disabled={adicionando}
              className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
            >
              {adicionando ? "..." : "Adicionar passo"}
            </button>
            {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
