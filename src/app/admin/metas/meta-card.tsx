"use client";

import { useActionState, useEffect, useState } from "react";
import { salvarMeta, excluirMeta, alternarAtivaMeta, type MetaState } from "@/lib/actions/metas";
import {
  LABEL_TIPO_META,
  formatarValorMeta,
  valorEditavelMeta,
  calcularNiveisAtingidos,
  nivelAtual,
  proximoNivel,
} from "@/lib/metas";
import { formatarReais } from "@/lib/format";
import { NivelInputs } from "./nivel-inputs";

const estadoInicial: MetaState = {};

type Nivel = { id: string; ordem: number; nome: string; valorAlvo: number; bonificacaoCentavos: number };

export function MetaCard({
  metaId,
  barbeiroId,
  tipo,
  ativa,
  niveis,
  valorAtual,
}: {
  metaId: string;
  barbeiroId: string;
  tipo: string;
  ativa: boolean;
  niveis: Nivel[];
  valorAtual: number;
}) {
  const [editando, setEditando] = useState(false);
  const [estado, formAction, pendente] = useActionState(salvarMeta, estadoInicial);

  useEffect(() => {
    if (editando && !estado.erro && !pendente && estado !== estadoInicial) setEditando(false);
  }, [estado, pendente, editando]);

  const niveisComProgresso = calcularNiveisAtingidos(niveis, valorAtual);
  const atual = nivelAtual(niveisComProgresso);
  const proximo = proximoNivel(niveisComProgresso);
  const ultimoNivel = niveisComProgresso[niveisComProgresso.length - 1];
  const percentualAteProximo = proximo
    ? Math.min((valorAtual / proximo.valorAlvo) * 100, 100)
    : ultimoNivel
      ? 100
      : 0;

  if (editando) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <form action={formAction}>
          <input type="hidden" name="barbeiroId" value={barbeiroId} />
          <input type="hidden" name="tipo" value={tipo} />
          <p className="font-semibold mb-3">{LABEL_TIPO_META[tipo]}</p>
          <NivelInputs
            tipo={tipo}
            niveisIniciais={niveis.map((n) => ({
              nome: n.nome,
              valor: valorEditavelMeta(tipo, n.valorAlvo),
              bonificacao: (n.bonificacaoCentavos / 100).toFixed(2).replace(".", ","),
            }))}
          />
          {estado.erro && <p className="text-red-600 text-sm mt-3">{estado.erro}</p>}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={pendente}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
            >
              {pendente ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="text-slate-500 hover:text-slate-800 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${!ativa ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold">{LABEL_TIPO_META[tipo]}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditando(true)} className="text-sm text-slate-500 hover:text-blue-600">
            Editar
          </button>
          <form action={alternarAtivaMeta.bind(null, metaId, !ativa)}>
            <button className="text-sm text-slate-500 hover:text-blue-600">{ativa ? "Desativar" : "Ativar"}</button>
          </form>
          <form
            action={excluirMeta.bind(null, metaId)}
            onSubmit={(e) => {
              if (!confirm(`Excluir a meta de ${LABEL_TIPO_META[tipo]}?`)) e.preventDefault();
            }}
          >
            <button className="text-sm text-slate-400 hover:text-red-600">Excluir</button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {niveisComProgresso.map((n) => (
          <span
            key={n.ordem}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              n.atingido ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {n.atingido ? "✓" : "○"} {n.nome} — {formatarValorMeta(tipo, n.valorAlvo)}
            {n.bonificacaoCentavos > 0 && ` (bônus ${formatarReais(n.bonificacaoCentavos)})`}
          </span>
        ))}
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full ${atual ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${percentualAteProximo}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        Atual: {formatarValorMeta(tipo, valorAtual)}
        {proximo && ` · faltam ${formatarValorMeta(tipo, Math.max(proximo.valorAlvo - valorAtual, 0))} para ${proximo.nome}`}
        {!proximo && atual && " · todos os níveis atingidos! 🎉"}
      </p>
    </div>
  );
}
