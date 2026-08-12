"use client";

import { useState } from "react";
import { TIPOS_META_EM_CENTAVOS } from "@/lib/metas";

type Nivel = { nome: string; valor: string; bonificacao: string };

const NIVEIS_PADRAO: Nivel[] = [
  { nome: "Bronze", valor: "", bonificacao: "" },
  { nome: "Prata", valor: "", bonificacao: "" },
  { nome: "Ouro", valor: "", bonificacao: "" },
];

export function NivelInputs({
  tipo,
  niveisIniciais,
}: {
  tipo: string;
  niveisIniciais?: { nome: string; valor: string; bonificacao: string }[];
}) {
  const [niveis, setNiveis] = useState<Nivel[]>(niveisIniciais && niveisIniciais.length > 0 ? niveisIniciais : NIVEIS_PADRAO);
  const emCentavos = TIPOS_META_EM_CENTAVOS.has(tipo);

  function atualizar(i: number, campo: keyof Nivel, valor: string) {
    setNiveis((atual) => atual.map((n, idx) => (idx === i ? { ...n, [campo]: valor } : n)));
  }

  function remover(i: number) {
    setNiveis((atual) => atual.filter((_, idx) => idx !== i));
  }

  function adicionar() {
    setNiveis((atual) => [...atual, { nome: "", valor: "", bonificacao: "" }]);
  }

  return (
    <div>
      <div className="space-y-2 mb-2">
        {niveis.map((n, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nível {i + 1}</label>
              <input
                name="nivelNome"
                required
                placeholder="Nome"
                value={n.nome}
                onChange={(e) => atualizar(i, "nome", e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{emCentavos ? "Alvo (R$)" : "Alvo (qtd)"}</label>
              <input
                name="nivelValor"
                required
                placeholder={emCentavos ? "3000,00" : "80"}
                value={n.valor}
                onChange={(e) => atualizar(i, "valor", e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-28"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bônus (R$)</label>
              <input
                name="nivelBonificacao"
                placeholder="0,00"
                value={n.bonificacao}
                onChange={(e) => atualizar(i, "bonificacao", e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-24"
              />
            </div>
            {niveis.length > 1 && (
              <button
                type="button"
                onClick={() => remover(i)}
                className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm py-1.5"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={adicionar} className="text-blue-600 hover:underline text-sm">
        + Adicionar nível
      </button>
    </div>
  );
}
