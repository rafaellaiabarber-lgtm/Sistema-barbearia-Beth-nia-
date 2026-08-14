"use client";

import { useActionState, useState } from "react";
import type { Servico, Produto } from "@prisma/client";
import { concluirAtendimento, type ConcluirState } from "@/lib/actions/fila";
import { formatarReais } from "@/lib/format";
import { SeletorFormaPagamento } from "../../forma-pagamento-selector";
import { Valor } from "../../valor";

const estadoInicial: ConcluirState = {};

export function ConcluirForm({
  atendimentoId,
  servicos,
  produtos,
}: {
  atendimentoId: string;
  servicos: Servico[];
  produtos: Produto[];
}) {
  const acaoComId = concluirAtendimento.bind(null, atendimentoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [quantidadesProduto, setQuantidadesProduto] = useState<Record<string, number>>({});

  function alternarServico(id: string) {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id]));
  }

  function ajustarQuantidadeProduto(id: string, delta: number) {
    setQuantidadesProduto((atual) => {
      const nova = Math.max(0, (atual[id] ?? 0) + delta);
      return { ...atual, [id]: nova };
    });
  }

  const totalServicosCentavos = servicos
    .filter((s) => selecionados.includes(s.id))
    .reduce((soma, s) => soma + s.precoCentavos, 0);

  const produtosSelecionados = produtos
    .map((p) => ({ produto: p, quantidade: quantidadesProduto[p.id] ?? 0 }))
    .filter((p) => p.quantidade > 0);
  const totalProdutosCentavos = produtosSelecionados.reduce(
    (soma, p) => soma + p.produto.precoCentavos * p.quantidade,
    0
  );

  const totalCentavos = totalServicosCentavos + totalProdutosCentavos;

  return (
    <form action={formAction}>
      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Serviço(s) realizado(s):</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {servicos.map((s) => {
          const ativo = selecionados.includes(s.id);
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => alternarServico(s.id)}
              className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                ativo
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
              }`}
            >
              <span className="block text-slate-900 dark:text-white font-medium">{s.nome}</span>
              <span className="block text-blue-600 dark:text-blue-400 text-xs"><Valor>{formatarReais(s.precoCentavos)}</Valor></span>
            </button>
          );
        })}
      </div>
      {selecionados.map((id) => (
        <input key={id} type="hidden" name="servicoIds" value={id} />
      ))}

      {produtos.length > 0 && (
        <>
          <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Produto(s) vendido(s) (opcional):</p>
          <div className="space-y-2 mb-3">
            {produtos.map((p) => {
              const quantidade = quantidadesProduto[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                    quantidade > 0
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <span className="block text-slate-900 dark:text-white font-medium">{p.nome}</span>
                    <span className="block text-blue-600 dark:text-blue-400 text-xs"><Valor>{formatarReais(p.precoCentavos)}</Valor></span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => ajustarQuantidadeProduto(p.id, -1)}
                      disabled={quantidade === 0}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-semibold text-slate-900 dark:text-white">{quantidade}</span>
                    <button
                      type="button"
                      onClick={() => ajustarQuantidadeProduto(p.id, 1)}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {produtosSelecionados.map((p) => (
            <span key={p.produto.id}>
              <input type="hidden" name="produtoIds" value={p.produto.id} />
              <input type="hidden" name="produtoQuantidades" value={p.quantidade} />
            </span>
          ))}
        </>
      )}

      {totalCentavos > 0 && (
        <p className="text-blue-600 dark:text-blue-400 font-semibold mb-3">Total: <Valor>{formatarReais(totalCentavos)}</Valor></p>
      )}

      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Forma de pagamento:</p>
      <div className="mb-3">
        <SeletorFormaPagamento />
      </div>

      {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 px-4 py-2 font-semibold"
      >
        {pendente ? "Concluindo..." : "Concluir atendimento"}
      </button>
    </form>
  );
}
