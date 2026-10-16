"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { Pause, Play, SkipForward, Flag, RotateCcw, Check, Trophy } from "lucide-react";
import { salvarRegistroCorte, type SalvarCorteResultado } from "@/lib/actions/cronometro";
import { ETAPAS, LABEL_ETAPA, DICA_ETAPA, formatarDuracao, formatarMinutos, type EtapaCorte } from "@/lib/cronometro";

type Passo = { id: string; etapa: EtapaCorte; texto: string };
type Tecnica = { id: string; nome: string; passos: Passo[] };

// Fica salvo no aparelho: se a tela apagar, o navegador recarregar ou o barbeiro trocar de aba,
// o corte em andamento continua de onde parou.
type Sessao = {
  tecnicaId: string;
  iniciadoEm: number;
  etapa: number;
  acumuladoMs: number[];
  segmentoInicio: number | null; // null = pausado
  marcados: string[];
  finalizado: boolean;
};

const CHAVE_STORAGE = "cronometro-corte-v1";

// Store mínima em cima do localStorage pro useSyncExternalStore (sincroniza também entre abas).
const ouvintes = new Set<() => void>();

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  window.addEventListener("storage", ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", ouvinte);
  };
}

function lerSessaoBruta(): string | null {
  try {
    return localStorage.getItem(CHAVE_STORAGE);
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null) {
  try {
    if (sessao) localStorage.setItem(CHAVE_STORAGE, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_STORAGE);
  } catch {}
  ouvintes.forEach((o) => o());
}

function interpretarSessao(bruto: string | null): Sessao | null {
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Sessao;
  } catch {
    return null;
  }
}

function msDaEtapa(sessao: Sessao, i: number, agora: number) {
  const corrente = i === sessao.etapa && sessao.segmentoInicio !== null ? agora - sessao.segmentoInicio : 0;
  return sessao.acumuladoMs[i] + corrente;
}

// Mantém a tela do celular acesa enquanto o cronômetro roda.
function useTelaAcesa(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelado = false;
    const pedir = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (cancelado) l.release();
          else lock = l;
        })
        .catch(() => {});
    pedir();
    const aoVoltar = () => document.visibilityState === "visible" && pedir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoVoltar);
      lock?.release().catch(() => {});
    };
  }, [ativo]);
}

export function Cronometro({ tecnicas, podeRegistrar }: { tecnicas: Tecnica[]; podeRegistrar: boolean }) {
  // undefined no servidor/hidratação: ainda não sabemos se tem corte em andamento salvo no aparelho.
  const bruto = useSyncExternalStore(assinar, lerSessaoBruta, () => undefined);
  const carregado = bruto !== undefined;
  const sessao = useMemo(() => {
    const salva = interpretarSessao(bruto ?? null);
    // Ignora sessão de uma técnica que foi removida/desativada.
    return salva && tecnicas.some((t) => t.id === salva.tecnicaId) ? salva : null;
  }, [bruto, tecnicas]);
  const [tecnicaEscolhida, setTecnicaEscolhida] = useState(tecnicas[0]?.id ?? "");
  const [agora, setAgora] = useState(() => Date.now());
  const [resultado, setResultado] = useState<SalvarCorteResultado | null>(null);
  const [salvando, startSalvar] = useTransition();

  const setSessao = useCallback((nova: Sessao | null) => gravarSessao(nova), []);

  const rodando = !!sessao && !sessao.finalizado && sessao.segmentoInicio !== null;
  useTelaAcesa(rodando);

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [rodando]);

  if (!carregado) return <div className="h-64" />;

  if (tecnicas.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center">
        <p className="font-semibold mb-1">Nenhuma técnica cadastrada ainda</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Peça pro admin cadastrar as técnicas (Low Fade, Mid Fade...) em Painel admin → Cronômetro de corte.
        </p>
      </div>
    );
  }

  if (!podeRegistrar) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Seu usuário não está vinculado a um barbeiro, então não dá pra cronometrar cortes com ele.
      </p>
    );
  }

  // ---------- Escolher técnica ----------
  if (!sessao) {
    return (
      <div className="space-y-4">
        {resultado?.sucesso && <ResultadoSalvo resultado={resultado} />}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <p className="font-semibold mb-3">Qual corte você vai fazer?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {tecnicas.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTecnicaEscolhida(t.id)}
                className={`rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-colors ${
                  tecnicaEscolhida === t.id
                    ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300"
                    : "border-neutral-200 dark:border-neutral-700 hover:border-orange-400"
                }`}
              >
                {t.nome}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!tecnicaEscolhida}
            onClick={() => {
              const inicio = Date.now();
              setResultado(null);
              setAgora(inicio);
              setSessao({
                tecnicaId: tecnicaEscolhida,
                iniciadoEm: inicio,
                etapa: 0,
                acumuladoMs: [0, 0, 0, 0],
                segmentoInicio: inicio,
                marcados: [],
                finalizado: false,
              });
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-lg py-5"
          >
            <Play className="w-6 h-6" /> Iniciar corte
          </button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 text-center">
            Começa na etapa Máquina. Toque em “Próxima etapa” a cada fase.
          </p>
        </div>
      </div>
    );
  }

  const tecnica = tecnicas.find((t) => t.id === sessao.tecnicaId)!;
  const temposMs = ETAPAS.map((_, i) => msDaEtapa(sessao, i, agora));
  const totalMs = temposMs.reduce((a, b) => a + b, 0);

  // ---------- Resumo do corte finalizado ----------
  if (sessao.finalizado) {
    const segundos = Object.fromEntries(ETAPAS.map((e, i) => [e, Math.round(temposMs[i] / 1000)])) as Record<
      EtapaCorte,
      number
    >;
    const totalSeg = Math.round(totalMs / 1000);
    const maior = ETAPAS.reduce((m, e) => (segundos[e] > segundos[m] ? e : m), ETAPAS[0]);

    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{tecnica.nome} finalizado em</p>
          <p className="text-5xl font-bold tabular-nums">{formatarDuracao(totalSeg)}</p>
        </div>

        <BarrasEtapas segundos={segundos} destaque={maior} />

        <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-3 text-sm">
          <p className="font-semibold text-orange-700 dark:text-orange-300">
            Onde foi mais tempo: {LABEL_ETAPA[maior]} ({Math.round((segundos[maior] / Math.max(totalSeg, 1)) * 100)}%)
          </p>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">{DICA_ETAPA[maior]}</p>
        </div>

        {resultado?.erro && <p className="text-red-600 text-sm">{resultado.erro}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={salvando}
            onClick={() => {
              if (confirm("Descartar esse corte sem salvar?")) setSessao(null);
            }}
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 py-3 font-semibold text-sm"
          >
            Descartar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={() =>
              startSalvar(async () => {
                const r = await salvarRegistroCorte({
                  tecnicaId: sessao.tecnicaId,
                  iniciadoEm: sessao.iniciadoEm,
                  segundos,
                });
                setResultado(r);
                if (r.sucesso) {
                  setTecnicaEscolhida(sessao.tecnicaId);
                  setSessao(null);
                }
              })
            }
            className="rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-3 font-bold"
          >
            {salvando ? "Salvando..." : "Salvar corte"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Corte em andamento ----------
  const etapaAtual = ETAPAS[sessao.etapa];
  const ultimaEtapa = sessao.etapa === ETAPAS.length - 1;
  const pausado = sessao.segmentoInicio === null;
  const passosDaEtapa = tecnica.passos.filter((p) => p.etapa === etapaAtual);

  function fecharSegmento(s: Sessao, instante: number) {
    const acumuladoMs = [...s.acumuladoMs];
    if (s.segmentoInicio !== null) acumuladoMs[s.etapa] += instante - s.segmentoInicio;
    return acumuladoMs;
  }

  function avancar() {
    const instante = Date.now();
    setAgora(instante);
    const acumuladoMs = fecharSegmento(sessao!, instante);
    if (ultimaEtapa) {
      setSessao({ ...sessao!, acumuladoMs, segmentoInicio: null, finalizado: true });
    } else {
      setSessao({ ...sessao!, acumuladoMs, etapa: sessao!.etapa + 1, segmentoInicio: instante });
    }
  }

  function alternarPausa() {
    const instante = Date.now();
    setAgora(instante);
    if (pausado) setSessao({ ...sessao!, segmentoInicio: instante });
    else setSessao({ ...sessao!, acumuladoMs: fecharSegmento(sessao!, instante), segmentoInicio: null });
  }

  function alternarPasso(id: string) {
    const marcados = sessao!.marcados.includes(id)
      ? sessao!.marcados.filter((m) => m !== id)
      : [...sessao!.marcados, id];
    setSessao({ ...sessao!, marcados });
  }

  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 text-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between text-sm text-orange-300 mb-2">
          <span className="font-semibold">{tecnica.nome}</span>
          <span className="tabular-nums">Total {formatarDuracao(totalMs / 1000)}</span>
        </div>

        <div className="text-center py-4">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider">
            Etapa {sessao.etapa + 1} de {ETAPAS.length} · {LABEL_ETAPA[etapaAtual]}
          </p>
          <p className={`text-7xl sm:text-8xl font-bold tabular-nums ${pausado ? "opacity-50" : ""}`}>
            {formatarDuracao(temposMs[sessao.etapa] / 1000)}
          </p>
          {pausado && <p className="text-orange-300 text-sm mt-1">Pausado</p>}
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {ETAPAS.map((e, i) => (
            <div
              key={e}
              className={`rounded-lg px-1 py-2 text-center ${
                i === sessao.etapa ? "bg-orange-600" : i < sessao.etapa ? "bg-white/15" : "bg-white/5 text-white/40"
              }`}
            >
              <p className="text-[11px] leading-tight">{LABEL_ETAPA[e]}</p>
              <p className="text-xs font-semibold tabular-nums">{i <= sessao.etapa ? formatarDuracao(temposMs[i] / 1000) : "--:--"}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={avancar}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-lg py-5"
        >
          {ultimaEtapa ? (
            <>
              <Flag className="w-6 h-6" /> Finalizar corte
            </>
          ) : (
            <>
              <SkipForward className="w-6 h-6" /> Próxima: {LABEL_ETAPA[ETAPAS[sessao.etapa + 1]]}
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={alternarPausa}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 py-3 text-sm font-semibold"
          >
            {pausado ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {pausado ? "Retomar" : "Pausar"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Cancelar esse corte? O tempo marcado até agora será perdido.")) setSessao(null);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 py-3 text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
        <p className="font-semibold mb-2">Checklist · {LABEL_ETAPA[etapaAtual]}</p>
        {passosDaEtapa.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Sem passos cadastrados pra essa etapa.</p>
        ) : (
          <ol className="space-y-2">
            {passosDaEtapa.map((p, i) => {
              const marcado = sessao.marcados.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => alternarPasso(p.id)}
                    className={`w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                      marcado
                        ? "border-green-500/40 bg-green-500/10 text-neutral-500 dark:text-neutral-400 line-through"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                        marcado ? "bg-green-600 border-green-600 text-white" : "border-neutral-400"
                      }`}
                    >
                      {marcado ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    {p.texto}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function BarrasEtapas({ segundos, destaque }: { segundos: Record<EtapaCorte, number>; destaque: EtapaCorte }) {
  const max = Math.max(...ETAPAS.map((e) => segundos[e]), 1);
  return (
    <div className="space-y-2">
      {ETAPAS.map((e) => (
        <div key={e} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0">{LABEL_ETAPA[e]}</span>
          <div className="flex-1 h-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${e === destaque ? "bg-orange-500" : "bg-neutral-400 dark:bg-neutral-500"}`}
              style={{ width: `${(segundos[e] / max) * 100}%` }}
            />
          </div>
          <span className="w-14 text-right tabular-nums">{formatarDuracao(segundos[e])}</span>
        </div>
      ))}
    </div>
  );
}

function ResultadoSalvo({ resultado }: { resultado: SalvarCorteResultado }) {
  const total = resultado.segundosTotal ?? 0;
  const media = resultado.mediaAnterior ?? null;
  const diferenca = media !== null ? media - total : 0;

  return (
    <div
      className={`rounded-2xl p-4 border ${
        resultado.recorde ? "bg-yellow-400/15 border-yellow-500/50" : "bg-green-500/10 border-green-500/40"
      }`}
    >
      <p className="font-bold flex items-center gap-2">
        {resultado.recorde ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Check className="w-5 h-5 text-green-600" />}
        {resultado.recorde ? "Novo recorde pessoal!" : "Corte salvo!"} {formatarDuracao(total)}
      </p>
      {media !== null && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
          {diferenca > 0
            ? `${formatarMinutos(diferenca)} mais rápido que a sua média nessa técnica.`
            : `${formatarMinutos(-diferenca)} acima da sua média — o próximo sai melhor.`}{" "}
          <Link href="/cronometro/evolucao" className="text-orange-600 dark:text-orange-400 hover:underline">
            Ver evolução →
          </Link>
        </p>
      )}
    </div>
  );
}
