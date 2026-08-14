"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { criarMaterial, type MaterialState } from "@/lib/actions/treinamento";
import { LABEL_TIPO_MATERIAL, type TipoMaterial } from "@/lib/treinamento";

const estadoInicial: MaterialState = {};

export function NovoMaterialForm() {
  const [estado, formAction, pendente] = useActionState(criarMaterial, estadoInicial);
  const [tipo, setTipo] = useState<TipoMaterial>("TEXTO");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
      setTipo("TEXTO");
    }
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 space-y-3 shadow-sm"
    >
      <p className="font-semibold text-sm">Novo material</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Título</label>
          <input
            name="titulo"
            required
            placeholder="Ex.: Cronograma da primeira semana"
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-64"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMaterial)}
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
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
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Texto</label>
          <textarea
            name="conteudo"
            required
            rows={4}
            placeholder="Escreva o conteúdo aqui..."
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-full"
          />
        </div>
      )}
      {(tipo === "LINK" || tipo === "VIDEO") && (
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {tipo === "VIDEO" ? "Link do vídeo (YouTube ou Google Drive)" : "Link (planilha, PDF, etc.)"}
          </label>
          <input
            name="conteudo"
            required
            placeholder="https://..."
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-full"
          />
        </div>
      )}
      {tipo === "ARQUIVO" && (
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            Arquivo (planilha, PDF, etc. — até 20MB)
          </label>
          <input
            name="arquivo"
            type="file"
            required
            className="block text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-blue-700"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar material"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}
    </form>
  );
}
