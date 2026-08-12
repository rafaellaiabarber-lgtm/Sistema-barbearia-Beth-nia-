"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Plano } from "@prisma/client";
import { criarAssinatura, type AssinaturaState } from "@/lib/actions/assinaturas";
import { buscarNomePorTelefone } from "@/lib/actions/fila";
import { formatarReais } from "@/lib/format";

const estadoInicial: AssinaturaState = {};

export function NovaAssinaturaForm({ planos }: { planos: Plano[] }) {
  const [estado, formAction, pendente] = useActionState(criarAssinatura, estadoInicial);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
      setNome("");
      setTelefone("");
      setClienteEncontrado(false);
    }
  }, [estado]);

  useEffect(() => {
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefone]);

  return (
    <details className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 select-none">
        Nova assinatura
      </summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-1">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Telefone</label>
            <input
              name="telefone"
              required
              placeholder="11999999999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nome do cliente</label>
            <input
              name="nome"
              required
              placeholder={buscandoNome ? "Verificando..." : "Nome"}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Plano</label>
            <select
              name="planoId"
              required
              defaultValue=""
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm"
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
            <label className="block text-xs text-slate-500 mb-1">Dia de vencimento</label>
            <input
              name="diaVencimento"
              type="number"
              min={1}
              max={28}
              defaultValue={5}
              required
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-20"
            />
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
