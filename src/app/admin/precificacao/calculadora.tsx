"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { formatarReais, reaisParaCentavos } from "@/lib/format";
import { calcularPrecoSugerido } from "@/lib/precificacao";
import { atualizarImpostoPadrao, type ConfiguracaoFinanceiraState } from "@/lib/actions/caixa";

const estadoInicial: ConfiguracaoFinanceiraState = {};

function paraNumero(valor: string): number {
  const normalizado = valor.replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  return Number.isNaN(numero) ? 0 : numero;
}

export function Calculadora({
  taxaCartaoDefault,
  impostoDefault,
}: {
  taxaCartaoDefault: string;
  impostoDefault: string;
}) {
  const [custo, setCusto] = useState("");
  const [taxaCartao, setTaxaCartao] = useState(taxaCartaoDefault);
  const [imposto, setImposto] = useState(impostoDefault);
  const [comissao, setComissao] = useState("50");
  const [margem, setMargem] = useState("30");

  const [estadoImposto, salvarImpostoAction, salvandoImposto] = useActionState(atualizarImpostoPadrao, estadoInicial);

  const resultado = useMemo(() => {
    const custoCentavos = reaisParaCentavos(custo);
    if (custoCentavos <= 0) return null;
    return calcularPrecoSugerido({
      custoCentavos,
      taxaCartaoPercentual: paraNumero(taxaCartao),
      impostoPercentual: paraNumero(imposto),
      comissaoPercentual: paraNumero(comissao),
      margemDesejadaPercentual: paraNumero(margem),
    });
  }, [custo, taxaCartao, imposto, comissao, margem]);

  const somaPercentual =
    paraNumero(taxaCartao) + paraNumero(imposto) + paraNumero(comissao) + paraNumero(margem);
  const percentualInvalido = somaPercentual >= 100;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Dados do produto ou serviço</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Custo (R$)</label>
            <input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              placeholder="18,00"
              inputMode="decimal"
              className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Taxa da maquininha (%)</label>
              <input
                value={taxaCartao}
                onChange={(e) => setTaxaCartao(e.target.value)}
                placeholder="3,49"
                inputMode="decimal"
                className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Comissão do barbeiro (%)</label>
              <input
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                placeholder="50"
                inputMode="decimal"
                className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Imposto (%)</label>
              <input
                value={imposto}
                onChange={(e) => setImposto(e.target.value)}
                placeholder="6"
                inputMode="decimal"
                className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Margem de lucro desejada (%)</label>
              <input
                value={margem}
                onChange={(e) => setMargem(e.target.value)}
                placeholder="30"
                inputMode="decimal"
                className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <form action={salvarImpostoAction} className="flex items-center gap-2 pt-1">
            <input type="hidden" name="imposto" value={imposto} />
            <button
              type="submit"
              disabled={salvandoImposto}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-60"
            >
              {salvandoImposto ? "Salvando..." : "Salvar esse imposto como padrão"}
            </button>
            {estadoImposto.sucesso && <span className="text-xs text-green-600">Salvo!</span>}
            {estadoImposto.erro && <span className="text-xs text-red-600">{estadoImposto.erro}</span>}
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Preço sugerido</h2>
        {percentualInvalido ? (
          <p className="text-red-600 text-sm">
            A soma dos percentuais (taxa + imposto + comissão + margem) passou de 100%. Não tem preço possível — reduza
            algum desses valores.
          </p>
        ) : !resultado ? (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm">Preencha o custo pra calcular.</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-4">
              {formatarReais(resultado.precoSugeridoCentavos)}
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Custo do produto/insumo</span>
                <span>{formatarReais(reaisParaCentavos(custo))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Taxa da maquininha</span>
                <span>{formatarReais(resultado.taxaCartaoCentavos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Imposto</span>
                <span>{formatarReais(resultado.impostoCentavos)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Comissão do barbeiro</span>
                <span>{formatarReais(resultado.comissaoCentavos)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                <span className="font-medium text-green-600">Sua margem de lucro</span>
                <span className="font-medium text-green-600">{formatarReais(resultado.margemCentavos)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
