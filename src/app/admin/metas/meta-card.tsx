"use client";

import { useActionState, useEffect, useState } from "react";
import type { Servico, Produto } from "@prisma/client";
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

function paraInputDate(d: Date | null): string {
  if (!d) return "";
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function MetaCard({
  metaId,
  barbeiroId,
  tipo,
  ativa,
  niveis,
  valorAtual,
  dataInicio,
  dataFim,
  servicoNome,
  produtoNome,
  servicoId,
  produtoId,
  servicos,
  produtos,
}: {
  metaId: string;
  barbeiroId: string;
  tipo: string;
  ativa: boolean;
  niveis: Nivel[];
  valorAtual: number;
  dataInicio: Date | null;
  dataFim: Date | null;
  servicoNome: string | null;
  produtoNome: string | null;
  servicoId: string | null;
  produtoId: string | null;
  servicos: Servico[];
  produtos: Produto[];
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

  const ehVendaProduto = tipo === "VENDAS_PRODUTO";
  const periodoTexto =
    dataInicio && dataFim ? `${formatarData(dataInicio)} até ${formatarData(dataFim)}` : "mês atual";
  const escopoTexto = ehVendaProduto ? produtoNome : servicoNome;

  if (editando) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <form action={formAction}>
          <input type="hidden" name="metaId" value={metaId} />
          <input type="hidden" name="barbeiroId" value={barbeiroId} />
          <input type="hidden" name="tipo" value={tipo} />
          <p className="font-semibold mb-3">{LABEL_TIPO_META[tipo]}</p>

          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Data início</label>
              <input
                name="dataInicio"
                type="date"
                defaultValue={paraInputDate(dataInicio)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Data fim</label>
              <input
                name="dataFim"
                type="date"
                defaultValue={paraInputDate(dataFim)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            {ehVendaProduto ? (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Produto</label>
                <select
                  name="produtoId"
                  defaultValue={produtoId ?? ""}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                >
                  <option value="">Todos os produtos</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Serviço</label>
                <select
                  name="servicoId"
                  defaultValue={servicoId ?? ""}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                >
                  <option value="">Todos os serviços</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs mb-3">Deixe as datas em branco pra usar sempre o mês atual.</p>

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
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${!ativa ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold">{LABEL_TIPO_META[tipo]}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditando(true)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600">
            Editar
          </button>
          <form action={alternarAtivaMeta.bind(null, metaId, !ativa)}>
            <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600">{ativa ? "Desativar" : "Ativar"}</button>
          </form>
          <form
            action={excluirMeta.bind(null, metaId)}
            onSubmit={(e) => {
              if (!confirm(`Excluir a meta de ${LABEL_TIPO_META[tipo]}?`)) e.preventDefault();
            }}
          >
            <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Excluir</button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 text-xs px-2 py-0.5">
          Período: {periodoTexto}
        </span>
        {escopoTexto && (
          <span className="inline-block rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 text-xs px-2 py-0.5">
            {ehVendaProduto ? "Produto" : "Serviço"}: {escopoTexto}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {niveisComProgresso.map((n) => (
          <span
            key={n.ordem}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              n.atingido ? "bg-green-100 dark:bg-green-900 text-green-700" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {n.atingido ? "✓" : "○"} {n.nome} — {formatarValorMeta(tipo, n.valorAlvo)}
            {n.bonificacaoCentavos > 0 && ` (bônus ${formatarReais(n.bonificacaoCentavos)})`}
          </span>
        ))}
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full ${atual ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${percentualAteProximo}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Atual: {formatarValorMeta(tipo, valorAtual)}
        {proximo && ` · faltam ${formatarValorMeta(tipo, Math.max(proximo.valorAlvo - valorAtual, 0))} para ${proximo.nome}`}
        {!proximo && atual && " · todos os níveis atingidos! 🎉"}
      </p>
    </div>
  );
}
