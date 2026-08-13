"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro, Plano } from "@prisma/client";
import { criarAssinatura, type AssinaturaState } from "@/lib/actions/assinaturas";
import { buscarNomePorTelefone } from "@/lib/actions/fila";
import { buscarClientesPorNome, type SugestaoCliente } from "@/lib/actions/atendimentos";
import { formatarReais } from "@/lib/format";

const estadoInicial: AssinaturaState = {};

export function NovaAssinaturaForm({ planos, barbeiros }: { planos: Plano[]; barbeiros: Barbeiro[] }) {
  const [estado, formAction, pendente] = useActionState(criarAssinatura, estadoInicial);
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

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">
        Nova assinatura
      </summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-1">
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
                setClienteEncontrado(false);
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
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                  >
                    <span className="block text-slate-900 dark:text-white font-medium">{s.nome}</span>
                    <span className="block text-slate-400 dark:text-slate-500 text-xs">{s.telefone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Plano</label>
            <select
              name="planoId"
              required
              defaultValue=""
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Escolha
              </option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatarReais(p.precoCentavos)}/mês
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Dia de vencimento</label>
            <input
              name="diaVencimento"
              type="number"
              min={1}
              max={28}
              defaultValue={5}
              required
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-20"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Vendido por (opcional)</label>
            <select
              name="barbeiroId"
              defaultValue=""
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="">Sem vendedor</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {clienteEncontrado && (
          <p className="text-blue-600 text-xs mb-3">Cliente já cadastrado — nome preenchido automaticamente.</p>
        )}

        {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Criando..." : "Criar assinatura"}
        </button>
      </form>
    </details>
  );
}
