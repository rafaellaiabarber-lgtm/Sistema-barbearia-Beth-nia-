"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import type { Barbeiro, Servico, Produto } from "@prisma/client";
import { salvarMeta, type MetaState } from "@/lib/actions/metas";
import { LABEL_TIPO_META } from "@/lib/metas";
import { NivelInputs } from "./nivel-inputs";

const estadoInicial: MetaState = {};

export function NovaMetaForm({
  barbeiros,
  servicos,
  produtos,
}: {
  barbeiros: Barbeiro[];
  servicos: Servico[];
  produtos: Produto[];
}) {
  const [estado, formAction, pendente] = useActionState(salvarMeta, estadoInicial);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [tipo, setTipo] = useState("FATURAMENTO");
  const [servicoId, setServicoId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const barbeiroSelectRef = useRef<HTMLSelectElement>(null);
  const tipoSelectRef = useRef<HTMLSelectElement>(null);
  const servicoSelectRef = useRef<HTMLSelectElement>(null);
  const produtoSelectRef = useRef<HTMLSelectElement>(null);
  const valoresRef = useRef({ barbeiroId, tipo, servicoId, produtoId });
  valoresRef.current = { barbeiroId, tipo, servicoId, produtoId };

  useEffect(() => {
    if (estado.erro) {
      // React reseta os campos do <form> após a action rodar, mesmo quando ela retorna
      // um erro de validação. Reaplica o valor controlado nos <select> pra não perder a
      // escolha do barbeiro/tipo/serviço/produto (e travar ou distorcer o reenvio).
      if (barbeiroSelectRef.current) barbeiroSelectRef.current.value = valoresRef.current.barbeiroId;
      if (tipoSelectRef.current) tipoSelectRef.current.value = valoresRef.current.tipo;
      if (servicoSelectRef.current) servicoSelectRef.current.value = valoresRef.current.servicoId;
      if (produtoSelectRef.current) produtoSelectRef.current.value = valoresRef.current.produtoId;
      return;
    }
    if (!pendente) {
      formRef.current?.reset();
      setBarbeiroId("");
      setTipo("FATURAMENTO");
      setServicoId("");
      setProdutoId("");
    }
  }, [estado, pendente]);

  const ehVendaProduto = tipo === "VENDAS_PRODUTO";

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">Nova meta</summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro</label>
            <select
              ref={barbeiroSelectRef}
              name="barbeiroId"
              required
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Escolha
              </option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo de meta</label>
            <select
              ref={tipoSelectRef}
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              {Object.entries(LABEL_TIPO_META).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {ehVendaProduto ? (
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Produto (opcional)</label>
              <select
                ref={produtoSelectRef}
                name="produtoId"
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
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
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Serviço (opcional)</label>
              <select
                ref={servicoSelectRef}
                name="servicoId"
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
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

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Data início (opcional)</label>
            <input
              name="dataInicio"
              type="date"
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Data fim (opcional)</label>
            <input
              name="dataFim"
              type="date"
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            />
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-xs pb-2">Deixe em branco pra usar sempre o mês atual.</p>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
          Cada nível precisa de um alvo maior que o anterior (ex.: Bronze R$3.000, Prata R$5.000, Ouro R$8.000).
        </p>
        <NivelInputs key={tipo} tipo={tipo} />

        {estado.erro && <p className="text-red-600 text-sm mt-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Salvando..." : "Salvar meta"}
        </button>
      </form>
    </details>
  );
}
