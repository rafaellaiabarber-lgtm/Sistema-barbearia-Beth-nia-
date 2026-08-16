"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Servico } from "@prisma/client";
import {
  atualizarServico,
  alternarAtivoServico,
  alternarPontuaRanking,
  excluirServico,
  type ServicoState,
} from "@/lib/actions/servicos";
import { formatarReais } from "@/lib/format";
import { ComissaoServicoForm } from "./comissao-servico-form";
import { CustoServicoForm } from "./custo-servico-form";
import { FichasServicoForm } from "./fichas-servico-form";
import { Valor } from "../../valor";

const estadoInicial: ServicoState = {};

export function ServicoRow({ servico }: { servico: Servico }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarServico.bind(null, servico.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      setEditando(false);
    }
  }, [estado]);

  useEffect(() => {
    if (editando) {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [editando]);

  const margemCentavos = servico.precoCentavos - servico.custoCentavos;

  return (
    <div
      ref={rowRef}
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm scroll-mt-20 ${
        !servico.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={servico.nome}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-full sm:w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Preço (R$)</label>
            <input
              name="preco"
              required
              defaultValue={(servico.precoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Duração (min)</label>
            <input
              name="duracao"
              type="number"
              defaultValue={servico.duracaoMinutos}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-20"
            />
          </div>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 px-2 py-2"
          >
            Cancelar
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        </form>
      ) : (
        <>
          <div>
            <p className="font-semibold">{servico.nome}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              preço <Valor>{formatarReais(servico.precoCentavos)}</Valor> · custo <Valor>{formatarReais(servico.custoCentavos)}</Valor> ·
              margem{" "}
              <span className={margemCentavos < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                <Valor>{formatarReais(margemCentavos)}</Valor>
              </span>{" "}
              · {servico.duracaoMinutos} min ·{" "}
              {servico.comissaoPercentual !== null
                ? `comissão própria: ${servico.comissaoPercentual}%`
                : "comissão: padrão do barbeiro"}{" "}
              · {servico.fichas} ficha(s)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-slate-400 dark:text-slate-500">Custo</span>
              <CustoServicoForm servicoId={servico.id} custoCentavos={servico.custoCentavos} />
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-slate-400 dark:text-slate-500">Comissão</span>
              <ComissaoServicoForm servicoId={servico.id} comissaoPercentual={servico.comissaoPercentual} />
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-slate-400 dark:text-slate-500" title="Usado no Rateio de Assinatura pra dividir o pote proporcionalmente">
                Fichas
              </span>
              <FichasServicoForm servicoId={servico.id} fichas={servico.fichas} />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Editar
              </button>
              <form action={alternarPontuaRanking.bind(null, servico.id, !servico.pontuaRanking)}>
                <button
                  className={`text-sm ${servico.pontuaRanking ? "text-blue-600 dark:text-blue-400 hover:text-blue-800" : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"}`}
                  title="Se conta pontos no Ranking dos barbeiros quando esse serviço é feito"
                >
                  {servico.pontuaRanking ? "🏆 Conta no ranking" : "Não conta no ranking"}
                </button>
              </form>
              <form action={alternarAtivoServico.bind(null, servico.id, !servico.ativo)}>
                <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                  {servico.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form action={excluirServico.bind(null, servico.id)}>
                <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Excluir</button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
