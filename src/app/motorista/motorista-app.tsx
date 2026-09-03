"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Car, Wallet, Fuel, TrendingUp } from "lucide-react";
import { formatarReais, reaisParaCentavos } from "@/lib/format";

type Corrida = {
  id: string;
  data: string; // yyyy-mm-dd
  corridas: number;
  faturamentoCentavos: number;
  gastoCentavos: number;
};

const CHAVE_STORAGE = "motorista-uber-registros";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function inicioDaSemana() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

function inicioDoMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type Periodo = "hoje" | "semana" | "mes" | "tudo";

function carregarRegistros(): Corrida[] {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    return salvo ? JSON.parse(salvo) : [];
  } catch {
    return [];
  }
}

export default function MotoristaApp() {
  const [registros, setRegistros] = useState<Corrida[]>(carregarRegistros);
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  const [data, setData] = useState(hoje());
  const [corridas, setCorridas] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [gasto, setGasto] = useState("");

  useEffect(() => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(registros));
  }, [registros]);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const numCorridas = Number.parseInt(corridas, 10);
    if (!data || !numCorridas || numCorridas <= 0) return;

    const novo: Corrida = {
      id: crypto.randomUUID(),
      data,
      corridas: numCorridas,
      faturamentoCentavos: reaisParaCentavos(faturamento || "0"),
      gastoCentavos: reaisParaCentavos(gasto || "0"),
    };
    setRegistros((atual) => [novo, ...atual]);
    setCorridas("");
    setFaturamento("");
    setGasto("");
  }

  function remover(id: string) {
    setRegistros((atual) => atual.filter((r) => r.id !== id));
  }

  const registrosFiltrados = useMemo(() => {
    if (periodo === "tudo") return registros;
    const limite = periodo === "hoje" ? hoje() : periodo === "semana" ? inicioDaSemana() : inicioDoMes();
    return registros.filter((r) => r.data >= limite);
  }, [registros, periodo]);

  const resumo = useMemo(() => {
    const totalCorridas = registrosFiltrados.reduce((s, r) => s + r.corridas, 0);
    const totalFaturamento = registrosFiltrados.reduce((s, r) => s + r.faturamentoCentavos, 0);
    const totalGasto = registrosFiltrados.reduce((s, r) => s + r.gastoCentavos, 0);
    const totalLiquido = totalFaturamento - totalGasto;
    const mediaPorCorrida = totalCorridas > 0 ? Math.round(totalFaturamento / totalCorridas) : 0;
    return { totalCorridas, totalFaturamento, totalGasto, totalLiquido, mediaPorCorrida };
  }, [registrosFiltrados]);

  const listaOrdenada = useMemo(
    () => [...registrosFiltrados].sort((a, b) => (a.data < b.data ? 1 : -1)),
    [registrosFiltrados],
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-neutral-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-6 h-6" /> Controle do Motorista
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Lançamento rápido das corridas do dia — faturamento, gastos e o líquido no bolso.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <form
          onSubmit={adicionar}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Data</label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nº de corridas</label>
            <input
              type="number"
              min={1}
              required
              placeholder="0"
              value={corridas}
              onChange={(e) => setCorridas(e.target.value)}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Faturamento (R$)</label>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={faturamento}
              onChange={(e) => setFaturamento(e.target.value)}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Gastos (R$)</label>
            <input
              inputMode="decimal"
              placeholder="combustível, etc."
              value={gasto}
              onChange={(e) => setGasto(e.target.value)}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-36"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-4 py-2 text-sm"
          >
            Adicionar dia
          </button>
        </form>

        <div className="flex gap-2 mb-4">
          {(["hoje", "semana", "mes", "tudo"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                periodo === p
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {p === "hoje" ? "Hoje" : p === "semana" ? "Últimos 7 dias" : p === "mes" ? "Este mês" : "Tudo"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <Car className="w-5 h-5 text-neutral-400 mb-2" />
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{resumo.totalCorridas}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs">Corridas</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <Wallet className="w-5 h-5 text-neutral-400 mb-2" />
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatarReais(resumo.totalFaturamento)}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs">Faturamento bruto</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <Fuel className="w-5 h-5 text-neutral-400 mb-2" />
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatarReais(resumo.totalGasto)}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs">Gastos</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatarReais(resumo.totalLiquido)}</p>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs">Líquido no bolso</p>
          </div>
        </div>

        {resumo.totalCorridas > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Média de <span className="font-semibold text-neutral-700 dark:text-neutral-200">{formatarReais(resumo.mediaPorCorrida)}</span> por corrida
          </p>
        )}

        <div className="space-y-2">
          {listaOrdenada.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                  {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {r.corridas} {r.corridas === 1 ? "corrida" : "corridas"} · {formatarReais(r.faturamentoCentavos)}
                  {r.gastoCentavos > 0 && <> · gastos {formatarReais(r.gastoCentavos)}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-green-600 dark:text-green-400">
                  {formatarReais(r.faturamentoCentavos - r.gastoCentavos)}
                </p>
                <button
                  onClick={() => remover(r.id)}
                  aria-label="Remover registro"
                  className="text-neutral-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {listaOrdenada.length === 0 && (
            <p className="text-neutral-400 dark:text-neutral-500 text-center py-8">Nenhum registro nesse período ainda.</p>
          )}
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-8 text-center">
          Os dados ficam salvos só neste navegador (localStorage) — é um controle simples e local.
        </p>
      </main>
    </div>
  );
}
