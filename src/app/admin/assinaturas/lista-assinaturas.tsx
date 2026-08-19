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
import { Valor } from "../../valor";

type Pagamento = { id: string; competencia: string; pagoEm: Date };

type Assinatura = {
  id: string;
  status: string;
  diaVencimento: number;
  cliente: { nome: string; telefone: string | null };
  plano: { nome: string; precoCentavos: number };
  barbeiro: { nome: string } | null;
};

type Linha = {
  assinatura: Assinatura;
  pagamentoAtual: Pagamento | undefined;
  pago: boolean;
  outrosPagamentos: Pagamento[];
  inadimplente: boolean;
};

function normalizarDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function ListaAssinaturas({
  linhas,
  competencia,
  hoje,
}: {
  linhas: Linha[];
  competencia: string;
  hoje: string;
}) {
  const [busca, setBusca] = useState("");

  const linhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return linhas;
    const termoDigitos = normalizarDigitos(termo);
    return linhas.filter(({ assinatura: a }) => {
      const nomeBate = a.cliente.nome.toLowerCase().includes(termo);
      const telefoneBate = termoDigitos.length > 0 && (a.cliente.telefone ?? "").includes(termoDigitos);
      return nomeBate || telefoneBate;
    });
  }, [linhas, busca]);

  return (
    <div>
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
        {linhasFiltradas.map(({ assinatura: a, pagamentoAtual, pago, outrosPagamentos, inadimplente }) => (
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
                      <form action={desmarcarPagamentoAssinatura.bind(null, a.id, competencia)}>
                        <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                          ✓ Pago — desmarcar
                        </button>
                      </form>
                    ) : (
                      <form action={marcarPagamentoAssinatura.bind(null, a.id, a.plano.precoCentavos, competencia)}>
                        <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                          Marcar como pago hoje
                        </button>
                      </form>
                    )}
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
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                {outrosPagamentos.map((p) => (
                  <form key={p.id} action={desmarcarPagamentoAssinatura.bind(null, a.id, p.competencia)}>
                    <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-2.5 py-1 text-xs font-medium">
                      ✓ {p.pagoEm.toLocaleDateString("pt-BR")} ({formatarCompetencia(p.competencia)}) — desmarcar
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        ))}
        {linhasFiltradas.length === 0 && linhas.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura cadastrada ainda.</p>
        )}
        {linhasFiltradas.length === 0 && linhas.length > 0 && busca.trim() !== "" && (
          <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura encontrada pra essa busca.</p>
        )}
      </div>
    </div>
  );
}
