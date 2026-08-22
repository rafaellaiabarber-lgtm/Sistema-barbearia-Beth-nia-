"use client";

import { useMemo, useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { formatarReais, linkWhatsApp } from "@/lib/format";
import { formatarCompetencia } from "@/lib/assinaturas";
import {
  cancelarAssinatura,
  reativarAssinatura,
  marcarPagamentoAssinatura,
  desmarcarPagamentoAssinatura,
  marcarPagamentoComData,
} from "@/lib/actions/assinaturas";
import { EditarPagamento } from "../editar-pagamento";
import { TrocarPlano } from "./trocar-plano";
import { Valor } from "../../valor";

type Pagamento = { id: string; competencia: string; pagoEm: Date };

type Assinatura = {
  id: string;
  status: string;
  diaVencimento: number;
  cliente: { nome: string; telefone: string | null };
  plano: { id: string; nome: string; precoCentavos: number };
  barbeiro: { nome: string } | null;
};

type Linha = {
  assinatura: Assinatura;
  pagamentoAtual: Pagamento | undefined;
  pago: boolean;
  outrosPagamentos: Pagamento[];
  inadimplente: boolean;
  vencendo: boolean;
};

type Filtro = "todos" | "inadimplentes" | "vencendo";

function normalizarDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function ListaAssinaturas({
  linhas,
  competencia,
  hoje,
  totalAtivas,
  planos,
}: {
  linhas: Linha[];
  competencia: string;
  hoje: string;
  totalAtivas: number;
  planos: { id: string; nome: string }[];
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const inadimplentes = linhas.filter((l) => l.inadimplente);
  const vencendo = linhas.filter((l) => l.vencendo);

  const linhasFiltradas = useMemo(() => {
    let base = linhas;
    if (filtro === "inadimplentes") base = base.filter((l) => l.inadimplente);
    if (filtro === "vencendo") base = base.filter((l) => l.vencendo);

    const termo = busca.trim().toLowerCase();
    if (!termo) return base;
    const termoDigitos = normalizarDigitos(termo);
    return base.filter(({ assinatura: a }) => {
      const nomeBate = a.cliente.nome.toLowerCase().includes(termo);
      const telefoneBate = termoDigitos.length > 0 && (a.cliente.telefone ?? "").includes(termoDigitos);
      return nomeBate || telefoneBate;
    });
  }, [linhas, busca, filtro]);

  function alternarFiltro(novo: Filtro) {
    setFiltro((atual) => (atual === novo ? "todos" : novo));
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assinaturas ativas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalAtivas}</p>
        </div>
        <button
          type="button"
          onClick={() => alternarFiltro("inadimplentes")}
          className={`text-left bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition ${
            filtro === "inadimplentes" ? "border-red-400 ring-2 ring-red-200 dark:ring-red-900" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm">Inadimplentes ({formatarCompetencia(competencia)})</p>
          <p className={`text-2xl font-bold ${inadimplentes.length > 0 ? "text-red-600" : "text-green-600"}`}>
            {inadimplentes.length}
          </p>
        </button>
        <button
          type="button"
          onClick={() => alternarFiltro("vencendo")}
          className={`text-left bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition ${
            filtro === "vencendo" ? "border-amber-400 ring-2 ring-amber-200 dark:ring-amber-900" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm">Vencendo em até 3 dias</p>
          <p className={`text-2xl font-bold ${vencendo.length > 0 ? "text-amber-600" : "text-green-600"}`}>
            {vencendo.length}
          </p>
        </button>
      </div>

      {filtro !== "todos" && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Mostrando só {filtro === "inadimplentes" ? "inadimplentes" : "quem vence em até 3 dias"}.
          </span>
          <button type="button" onClick={() => setFiltro("todos")} className="text-blue-600 dark:text-blue-400 hover:underline">
            Ver todas
          </button>
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {linhasFiltradas.map(({ assinatura: a, pagamentoAtual, pago, outrosPagamentos, inadimplente, vencendo: linhaVencendo }) => (
          <div
            key={a.id}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
              a.status === "CANCELADA" ? "opacity-50" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{a.cliente.nome}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {a.plano.nome} — <Valor>{formatarReais(a.plano.precoCentavos)}</Valor>/mês · vence dia {a.diaVencimento}
                  {a.barbeiro ? ` · vendido por ${a.barbeiro.nome}` : ""} ·{" "}
                  {a.status === "CANCELADA" ? (
                    <span className="text-slate-400 dark:text-slate-500">cancelada</span>
                  ) : pago ? (
                    <span className="text-green-600 font-medium">
                      pago em {pagamentoAtual!.pagoEm.toLocaleDateString("pt-BR")} ({formatarCompetencia(competencia)})
                    </span>
                  ) : inadimplente ? (
                    <span className="text-red-600 font-medium">inadimplente ({formatarCompetencia(competencia)})</span>
                  ) : linhaVencendo ? (
                    <span className="text-amber-600 font-medium">vence em até 3 dias</span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">aguardando pagamento de {formatarCompetencia(competencia)}</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {a.cliente.telefone && (
                  <a
                    href={linkWhatsApp(a.cliente.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {a.status === "ATIVA" && (
                  <>
                    {pago ? (
                      <>
                        <form action={desmarcarPagamentoAssinatura.bind(null, a.id, competencia)}>
                          <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                            ✓ Pago — desmarcar
                          </button>
                        </form>
                        <EditarPagamento
                          pagamentoId={pagamentoAtual!.id}
                          dataAtual={pagamentoAtual!.pagoEm.toISOString().slice(0, 10)}
                        />
                      </>
                    ) : (
                      <form action={marcarPagamentoAssinatura.bind(null, a.id, a.plano.precoCentavos, competencia)}>
                        <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                          Marcar como pago hoje
                        </button>
                      </form>
                    )}
                    <TrocarPlano assinaturaId={a.id} planoAtualId={a.plano.id} planos={planos} />
                    <form action={cancelarAssinatura.bind(null, a.id)}>
                      <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Cancelar</button>
                    </form>
                  </>
                )}
                {a.status === "CANCELADA" && (
                  <form action={reativarAssinatura.bind(null, a.id)}>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Reativar</button>
                  </form>
                )}
              </div>
            </div>

            {a.status === "ATIVA" && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-2">
                <form action={marcarPagamentoComData} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="assinaturaId" value={a.id} />
                  <input type="hidden" name="valorCentavos" value={a.plano.precoCentavos} />
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Registrar pagamento em outra data (passada ou futura)
                    </label>
                    <input
                      type="date"
                      name="data"
                      defaultValue={hoje}
                      className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <button className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium hover:border-blue-400">
                    Registrar
                  </button>
                </form>
              </div>
            )}

            {outrosPagamentos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                {outrosPagamentos.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <form action={desmarcarPagamentoAssinatura.bind(null, a.id, p.competencia)}>
                      <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-2.5 py-1 text-xs font-medium">
                        ✓ {p.pagoEm.toLocaleDateString("pt-BR")} ({formatarCompetencia(p.competencia)}) — desmarcar
                      </button>
                    </form>
                    <EditarPagamento pagamentoId={p.id} dataAtual={p.pagoEm.toISOString().slice(0, 10)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {linhasFiltradas.length === 0 && linhas.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura cadastrada ainda.</p>
        )}
        {linhasFiltradas.length === 0 && linhas.length > 0 && (busca.trim() !== "" || filtro !== "todos") && (
          <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura encontrada com esse filtro.</p>
        )}
      </div>
    </div>
  );
}
