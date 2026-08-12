"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Servico } from "@prisma/client";
import {
  atualizarServico,
  alternarAtivoServico,
  excluirServico,
  type ServicoState,
} from "@/lib/actions/servicos";
import { formatarReais } from "@/lib/format";
import { ComissaoServicoForm } from "./comissao-servico-form";
import { CustoServicoForm } from "./custo-servico-form";

const estadoInicial: ServicoState = {};

export function ServicoRow({ servico }: { servico: Servico }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarServico.bind(null, servico.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      setEditando(false);
    }
  }, [estado]);

  const margemCentavos = servico.precoCentavos - servico.custoCentavos;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${
        !servico.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={servico.nome}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Preço (R$)</label>
            <input
              name="preco"
              required
              defaultValue={(servico.precoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Duração (min)</label>
            <input
              name="duracao"
              type="number"
              defaultValue={servico.duracaoMinutos}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-20"
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
            className="text-sm text-slate-500 hover:text-slate-800 px-2 py-2"
          >
            Cancelar
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        </form>
      ) : (
        <>
          <div>
            <p className="font-semibold">{servico.nome}</p>
            <p className="text-slate-500 text-sm">
              preço {formatarReais(servico.precoCentavos)} · custo {formatarReais(servico.custoCentavos)} ·
              margem{" "}
              <span className={margemCentavos < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                {formatarReais(margemCentavos)}
              </span>{" "}
              · {servico.duracaoMinutos} min ·{" "}
              {servico.comissaoPercentual !== null
                ? `comissão própria: ${servico.comissaoPercentual}%`
                : "comissão: padrão do barbeiro"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-slate-400">Custo</span>
              <CustoServicoForm servicoId={servico.id} custoCentavos={servico.custoCentavos} />
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs text-slate-400">Comissão</span>
              <ComissaoServicoForm servicoId={servico.id} comissaoPercentual={servico.comissaoPercentual} />
            </div>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-slate-600 hover:text-blue-600"
            >
              Editar
            </button>
            <form action={alternarAtivoServico.bind(null, servico.id, !servico.ativo)}>
              <button className="text-sm text-slate-600 hover:text-blue-600">
                {servico.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form action={excluirServico.bind(null, servico.id)}>
              <button className="text-sm text-slate-400 hover:text-red-600">Excluir</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
