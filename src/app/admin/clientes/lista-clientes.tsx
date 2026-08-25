"use client";

import { useActionState, useMemo, useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { formatarReais, linkWhatsApp } from "@/lib/format";
import { criarCliente, type ClienteState } from "@/lib/actions/clientes";
import { Valor } from "../../valor";

type Atendimento = {
  id: string;
  concluidoEm: Date | null;
  precoTotalCentavos: number;
  barbeiro: { nome: string } | null;
  servicos: { nomeSnapshot: string }[];
};

type ClienteComDados = {
  id: string;
  nome: string;
  telefone: string | null;
  atendimentos: Atendimento[];
  assinaturas: { plano: { nome: string } }[];
};

function normalizarDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function pareceTelefone(valor: string) {
  return normalizarDigitos(valor).length >= 8;
}

const estadoInicialCliente: ClienteState = {};

function CadastrarClienteForm({ busca }: { busca: string }) {
  const [estado, formAction, pendente] = useActionState(criarCliente, estadoInicialCliente);
  const ehTelefone = pareceTelefone(busca);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome</label>
        <input
          name="nome"
          required
          defaultValue={ehTelefone ? "" : busca}
          placeholder="Nome do cliente"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Telefone (opcional)</label>
        <input
          name="telefone"
          defaultValue={ehTelefone ? busca : ""}
          placeholder="11999999999"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-40"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Cadastrando..." : "Cadastrar cliente"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}

export function ListaClientes({ clientes }: { clientes: ClienteComDados[] }) {
  const [busca, setBusca] = useState("");

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    const termoDigitos = normalizarDigitos(termo);
    return clientes.filter((c) => {
      const nomeBate = c.nome.toLowerCase().includes(termo);
      const telefoneBate = termoDigitos.length > 0 && (c.telefone ?? "").includes(termoDigitos);
      return nomeBate || telefoneBate;
    });
  }, [clientes, busca]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -tranneutral-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 pl-9 pr-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-4">
        {clientesFiltrados.map((c) => {
          const totalGasto = c.atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
          return (
            <details key={c.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
              <summary className="cursor-pointer flex items-center justify-between">
                <span>
                  <span className="font-semibold">{c.nome}</span>{" "}
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm">{c.telefone ?? "sem telefone"}</span>
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                  {c.atendimentos.length} atendimento(s) · <Valor>{formatarReais(totalGasto)}</Valor>
                </span>
              </summary>
              <div className="mt-3 space-y-2">
                {c.telefone && (
                  <a
                    href={linkWhatsApp(c.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
                {c.assinaturas.length > 0 ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Assinante do plano {c.assinaturas[0].plano.nome}
                  </p>
                ) : c.telefone ? (
                  <a
                    href={`/admin/assinaturas?telefone=${encodeURIComponent(c.telefone)}&nome=${encodeURIComponent(c.nome)}`}
                    className="inline-block text-sm text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    + Adicionar assinatura
                  </a>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    Cadastre um telefone pra esse cliente pra poder criar uma assinatura.
                  </p>
                )}
                {c.atendimentos.length === 0 && (
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm">Sem atendimentos concluídos ainda.</p>
                )}
                {c.atendimentos.map((a) => (
                  <div key={a.id} className="text-sm border-t border-neutral-200 dark:border-neutral-800 pt-2">
                    <p className="text-neutral-700 dark:text-neutral-200">
                      {a.concluidoEm?.toLocaleDateString("pt-BR")} — {a.barbeiro?.nome ?? "—"} —{" "}
                      <Valor>{formatarReais(a.precoTotalCentavos)}</Valor>
                    </p>
                    <p className="text-neutral-400 dark:text-neutral-500">{a.servicos.map((s) => s.nomeSnapshot).join(", ")}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        {clientesFiltrados.length === 0 && clientes.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500">Nenhum cliente cadastrado ainda.</p>
        )}
        {clientesFiltrados.length === 0 && clientes.length > 0 && busca.trim() !== "" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Esse cliente não foi encontrado. Quer cadastrar ele?
            </p>
            <CadastrarClienteForm key={busca} busca={busca.trim()} />
          </div>
        )}
      </div>
    </div>
  );
}
