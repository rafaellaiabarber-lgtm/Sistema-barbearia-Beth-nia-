"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { MaterialTreinamento } from "@prisma/client";
import { atualizarMaterial, excluirMaterial, moverMaterial, type MaterialState } from "@/lib/actions/treinamento";
import { LABEL_TIPO_MATERIAL, type TipoMaterial } from "@/lib/treinamento";

const estadoInicial: MaterialState = {};

export function MaterialRow({
  material,
  primeiro,
  ultimo,
}: {
  material: MaterialTreinamento;
  primeiro: boolean;
  ultimo: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<TipoMaterial>(material.tipo);
  const acaoComId = atualizarMaterial.bind(null, material.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
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
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm scroll-mt-20"
    >
      {editando ? (
        <form action={formAction} className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Título</label>
              <input
                name="titulo"
                required
                defaultValue={material.titulo}
                className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-64"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tipo</label>
              <select
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMaterial)}
                className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              >
                {Object.entries(LABEL_TIPO_MATERIAL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {tipo === "TEXTO" && (
            <textarea
              name="conteudo"
              required
              rows={4}
              defaultValue={material.tipo === "TEXTO" ? material.conteudo : ""}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
            />
          )}
          {(tipo === "LINK" || tipo === "VIDEO") && (
            <input
              name="conteudo"
              required
              defaultValue={material.tipo === "LINK" || material.tipo === "VIDEO" ? material.conteudo : ""}
              placeholder="https://..."
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
            />
          )}
          {tipo === "ARQUIVO" && (
            <div>
              {material.tipo === "ARQUIVO" && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Já tem um arquivo enviado. Escolha um novo só se quiser substituir.
                </p>
              )}
              <input
                name="arquivo"
                type="file"
                required={material.tipo !== "ARQUIVO"}
                className="block text-sm text-neutral-600 dark:text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-orange-700"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
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
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800"
            >
              Cancelar
            </button>
          </div>
          {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{material.titulo}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{LABEL_TIPO_MATERIAL[material.tipo]}</p>
          </div>
          <div className="flex items-center gap-3">
            <form action={moverMaterial.bind(null, material.id, "cima")}>
              <button
                disabled={primeiro}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↑
              </button>
            </form>
            <form action={moverMaterial.bind(null, material.id, "baixo")}>
              <button
                disabled={ultimo}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↓
              </button>
            </form>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400"
            >
              Editar
            </button>
            <form action={excluirMaterial.bind(null, material.id)}>
              <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
