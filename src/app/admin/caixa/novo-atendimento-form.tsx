"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro, Servico } from "@prisma/client";
import {
  lancarAtendimentoManual,
  buscarClientesPorNome,
  type LancarAtendimentoState,
  type SugestaoCliente,
} from "@/lib/actions/atendimentos";
import { buscarNomePorTelefone } from "@/lib/actions/fila";
import { formatarReais } from "@/lib/format";
import { SeletorFormaPagamento } from "../../forma-pagamento-selector";

const estadoInicial: LancarAtendimentoState = {};

export function NovoAtendimentoForm({
  barbeiros,
  servicos,
}: {
  barbeiros: Barbeiro[];
  servicos: Servico[];
}) {
  const [estado, formAction, pendente] = useActionState(lancarAtendimentoManual, estadoInicial);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [sugestoes, setSugestoes] = useState<SugestaoCliente[]>([]);
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const ignorarBuscaTelefoneRef = useRef(false);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
      setSelecionados([]);
      setNome("");
      setTelefone("");
      setClienteEncontrado(false);
      setSugestoes([]);
      setSugestoesAbertas(false);
    }
  }, [estado]);

  useEffect(() => {
    if (ignorarBuscaTelefoneRef.current) {
      ignorarBuscaTelefoneRef.current = false;
      return;
    }

    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length < 10) {
      setClienteEncontrado(false);
      return;
    }

    let cancelado = false;
    setBuscandoNome(true);
    const timer = setTimeout(async () => {
      const nomeExistente = await buscarNomePorTelefone(digitos);
      if (cancelado) return;
      setBuscandoNome(false);
      if (nomeExistente) {
        setClienteEncontrado(true);
        setNome(nomeExistente);
      } else {
        setClienteEncontrado(false);
      }
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      setBuscandoNome(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefone]);

  useEffect(() => {
    const termo = nome.trim();
    if (!sugestoesAbertas || termo.length < 2) {
      setSugestoes([]);
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      const resultado = await buscarClientesPorNome(termo);
      if (!cancelado) setSugestoes(resultado);
    }, 300);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [nome, sugestoesAbertas]);

  function selecionarSugestao(cliente: SugestaoCliente) {
    ignorarBuscaTelefoneRef.current = true;
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setClienteEncontrado(true);
    setSugestoes([]);
    setSugestoesAbertas(false);
  }

  function alternarServico(id: string) {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id]));
  }

  const totalCentavos = servicos
    .filter((s) => selecionados.includes(s.id))
    .reduce((soma, s) => soma + s.precoCentavos, 0);

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">
        Lançar atendimento manual
      </summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
            <input
              name="telefone"
              required
              placeholder="11999999999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-40"
            />
          </div>
          <div className="relative">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome do cliente</label>
            <input
              name="nome"
              required
              placeholder={buscandoNome ? "Verificando..." : "Nome"}
              value={nome}
              autoComplete="off"
              onChange={(e) => {
                setNome(e.target.value);
                setSugestoesAbertas(true);
              }}
              onFocus={() => setSugestoesAbertas(true)}
              onBlur={() => setTimeout(() => setSugestoesAbertas(false), 150)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
            />
            {sugestoesAbertas && sugestoes.length > 0 && (
              <div className="absolute z-10 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden">
                {sugestoes.map((s) => (
                  <button
                    type="button"
                    key={s.telefone}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selecionarSugestao(s)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-lime-50"
                  >
                    <span className="block text-slate-900 dark:text-white font-medium">{s.nome}</span>
                    <span className="block text-slate-400 dark:text-slate-500 text-xs">{s.telefone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro</label>
            <select
              name="barbeiroId"
              required
              defaultValue=""
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
        </div>

        {clienteEncontrado && (
          <p className="text-lime-600 dark:text-lime-400 text-xs mb-3">Cliente já cadastrado — nome preenchido automaticamente.</p>
        )}

        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Serviço(s) realizado(s):</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {servicos.map((s) => {
            const ativo = selecionados.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => alternarServico(s.id)}
                className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                  ativo ? "border-lime-600 bg-lime-50 dark:bg-lime-950" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                }`}
              >
                <span className="block text-slate-900 dark:text-white font-medium">{s.nome}</span>
                <span className="block text-lime-600 dark:text-lime-400 text-xs">{formatarReais(s.precoCentavos)}</span>
              </button>
            );
          })}
        </div>
        {selecionados.map((id) => (
          <input key={id} type="hidden" name="servicoIds" value={id} />
        ))}

        {totalCentavos > 0 && (
          <p className="text-lime-600 dark:text-lime-400 font-semibold mb-3">Total: {formatarReais(totalCentavos)}</p>
        )}

        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Forma de pagamento:</p>
        <div className="mb-3 max-w-sm">
          <SeletorFormaPagamento />
        </div>

        {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-slate-950 font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Lançando..." : "Lançar atendimento"}
        </button>
      </form>
    </details>
  );
}
