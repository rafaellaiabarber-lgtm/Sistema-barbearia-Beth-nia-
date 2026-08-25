"use client";

import { useMemo, useRef, useState } from "react";
import { reaisParaCentavos, formatarReais } from "@/lib/format";

type ServicoOpcao = { id: string; nome: string; fichas: number };
type BarbeiroOpcao = { id: string; nome: string };

type Linha = {
  id: number;
  barbeiroId: string;
  servicoId: string; // id de um serviço cadastrado, ou "manual"
  fichasManual: string;
  quantidade: string;
};

const MANUAL = "manual";

export function SimuladorDistribuicao({
  servicos,
  barbeiros,
}: {
  servicos: ServicoOpcao[];
  barbeiros: BarbeiroOpcao[];
}) {
  const [aberto, setAberto] = useState(false);
  const [valorTotal, setValorTotal] = useState("");
  const proximoId = useRef(1);
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    barbeiros.length > 0 && servicos.length > 0
      ? [{ id: 0, barbeiroId: barbeiros[0].id, servicoId: servicos[0].id, fichasManual: "", quantidade: "1" }]
      : []
  );

  const servicosPorId = useMemo(() => new Map(servicos.map((s) => [s.id, s])), [servicos]);

  function adicionarLinha() {
    const id = proximoId.current++;
    setLinhas((atual) => [
      ...atual,
      {
        id,
        barbeiroId: barbeiros[0]?.id ?? "",
        servicoId: servicos[0]?.id ?? MANUAL,
        fichasManual: "",
        quantidade: "1",
      },
    ]);
  }

  function atualizarLinha(id: number, campo: keyof Linha, valor: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function removerLinha(id: number) {
    setLinhas((atual) => atual.filter((l) => l.id !== id));
  }

  const resultado = useMemo(() => {
    const valorTotalCentavos = reaisParaCentavos(valorTotal || "0");
    const fichasPorBarbeiro = new Map<string, number>();

    for (const l of linhas) {
      if (!l.barbeiroId) continue;
      const quantidade = Number.parseFloat(l.quantidade.replace(",", ".")) || 0;
      const fichasUnidade =
        l.servicoId === MANUAL
          ? Number.parseFloat(l.fichasManual.replace(",", ".")) || 0
          : (servicosPorId.get(l.servicoId)?.fichas ?? 0);
      const fichas = fichasUnidade * quantidade;
      fichasPorBarbeiro.set(l.barbeiroId, (fichasPorBarbeiro.get(l.barbeiroId) ?? 0) + fichas);
    }

    const totalFichas = [...fichasPorBarbeiro.values()].reduce((s, f) => s + f, 0);
    const entradas = [...fichasPorBarbeiro.entries()].filter(([, fichas]) => fichas > 0);

    let distribuidoCentavos = 0;
    const itens = entradas
      .map(([barbeiroId, fichas], i) => {
        let valorCentavos: number;
        if (totalFichas === 0) {
          valorCentavos = 0;
        } else if (i === entradas.length - 1) {
          valorCentavos = valorTotalCentavos - distribuidoCentavos;
        } else {
          valorCentavos = Math.round((valorTotalCentavos * fichas) / totalFichas);
          distribuidoCentavos += valorCentavos;
        }
        return { barbeiroId, nome: barbeiros.find((b) => b.id === barbeiroId)?.nome ?? "—", fichas, valorCentavos };
      })
      .sort((a, b) => b.valorCentavos - a.valorCentavos);

    return { totalFichas, itens, valorTotalCentavos };
  }, [linhas, valorTotal, servicosPorId, barbeiros]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-orange-600 dark:text-orange-400 text-sm hover:underline mb-8 block"
      >
        Simular distribuição com valores de exemplo →
      </button>
    );
  }

  const semDados = barbeiros.length === 0 || servicos.length === 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-8">
      <div className="flex items-start justify-between mb-1">
        <h2 className="font-semibold">Simular distribuição</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 text-sm"
        >
          Fechar
        </button>
      </div>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
        Monte um cenário de exemplo (ex.: "faturei R$ 10.000 e foram feitos esses procedimentos") e veja como
        ficaria a divisão entre os barbeiros. Isso é só uma simulação — não salva nem altera nada de verdade no
        sistema.
      </p>

      {semDados ? (
        <p className="text-neutral-400 dark:text-neutral-500 text-sm">
          Cadastre barbeiros e serviços primeiro pra poder simular.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Valor total faturado no mês (R$)
            </label>
            <input
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="10.000,00"
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-40"
            />
          </div>

          <div className="space-y-2 mb-3">
            {linhas.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-2">
                <select
                  value={l.barbeiroId}
                  onChange={(e) => atualizarLinha(l.id, "barbeiroId", e.target.value)}
                  className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm"
                >
                  {barbeiros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={l.servicoId}
                  onChange={(e) => atualizarLinha(l.id, "servicoId", e.target.value)}
                  className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm"
                >
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.fichas} ficha{s.fichas === 1 ? "" : "s"})
                    </option>
                  ))}
                  <option value={MANUAL}>Manual (informar fichas)</option>
                </select>

                {l.servicoId === MANUAL && (
                  <input
                    value={l.fichasManual}
                    onChange={(e) => atualizarLinha(l.id, "fichasManual", e.target.value)}
                    placeholder="fichas/unid."
                    className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm w-24"
                  />
                )}

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={l.quantidade}
                  onChange={(e) => atualizarLinha(l.id, "quantidade", e.target.value)}
                  className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm w-20"
                />
                <span className="text-neutral-400 dark:text-neutral-500 text-xs">unid.</span>

                <button
                  type="button"
                  onClick={() => removerLinha(l.id)}
                  className="text-neutral-400 dark:text-neutral-500 hover:text-red-600 text-sm ml-auto"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={adicionarLinha}
            className="text-orange-600 dark:text-orange-400 text-sm hover:underline mb-5 block"
          >
            + Adicionar linha
          </button>

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Resultado da simulação</p>
            <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-3">
              {resultado.totalFichas} ficha(s) no total, de {formatarReais(resultado.valorTotalCentavos)}
            </p>

            {resultado.itens.length > 0 ? (
              <div className="space-y-2">
                {resultado.itens.map((i) => (
                  <div
                    key={i.barbeiroId}
                    className="flex items-center justify-between text-sm border-t border-neutral-100 dark:border-neutral-800 pt-2"
                  >
                    <span className="font-medium">{i.nome}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">{i.fichas} ficha(s)</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatarReais(i.valorCentavos)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                Adicione ao menos uma linha com fichas pra ver a divisão.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
