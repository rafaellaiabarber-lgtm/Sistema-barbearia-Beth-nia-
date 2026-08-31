"use client";

import { useActionState, useEffect, useState } from "react";
import type { Barbeiro } from "@prisma/client";
import { entrarNaFila, buscarClienteInfoPorTelefone, type ClienteInfo, type EntrarFilaState } from "@/lib/actions/fila";
import { TecladoNumerico } from "./teclado-numerico";

const estadoInicial: EntrarFilaState = {};

type Etapa = "telefone" | "avisoPlano" | "nome" | "barbeiro" | "acompanhante";

export function TotemForm({
  barbearia,
  barbeiros,
  logoUrl,
}: {
  barbearia: { id: string; slug: string; nome: string };
  barbeiros: Barbeiro[];
  logoUrl: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(entrarNaFila, estadoInicial);
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [barbeiroPreferidoId, setBarbeiroPreferidoId] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [boasVindas, setBoasVindas] = useState(false);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo | null>(null);
  const [temAcompanhante, setTemAcompanhante] = useState<boolean | null>(null);
  const [acompanhanteNome, setAcompanhanteNome] = useState("");
  const [acompanhanteTelefone, setAcompanhanteTelefone] = useState("");

  const totemHref = `/${barbearia.slug}/totem`;

  useEffect(() => {
    if (!estado.sucesso) return;
    const timer = setTimeout(() => {
      window.location.href = totemHref;
    }, 2000);
    return () => clearTimeout(timer);
  }, [estado.sucesso, totemHref]);

  if (estado.sucesso) {
    return (
      <div className="w-full max-w-md bg-black/70 rounded-3xl shadow-xl p-10 border border-white/10 text-center">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-14 mx-auto mb-4 object-contain" />
        )}
        <p className="text-neutral-300 text-lg mb-2">Você entrou na fila!</p>
        <p className="text-7xl font-black text-orange-400 mb-4">{estado.posicao}º</p>
        {estado.acompanhanteNome && estado.acompanhantePosicao && (
          <p className="text-neutral-300 mb-2">
            {estado.acompanhanteNome} também entrou na fila, na posição{" "}
            <span className="font-bold text-orange-400">{estado.acompanhantePosicao}º</span>.
          </p>
        )}
        <p className="text-neutral-200 mb-8">
          É só aguardar, o profissional já vai te chamar.
        </p>
        <a
          href={totemHref}
          className="inline-block rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-6 py-3 transition-colors"
        >
          Concluir
        </a>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-black/70 rounded-3xl shadow-xl p-8 border border-white/10 ${
        etapa === "barbeiro" ? "max-w-3xl" : "max-w-xl"
      }`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={barbearia.nome} className="h-16 mx-auto mb-2 object-contain" />
      ) : (
        <h1 className="text-3xl font-black text-white text-center mb-1">{barbearia.nome}</h1>
      )}
      <p className="text-neutral-300 text-center mb-8">Toque para entrar na fila</p>

      {etapa === "telefone" && (
        <div>
          <p className="text-white text-xl font-semibold mb-4 text-center">
            Qual é o seu telefone?
          </p>
          <TecladoNumerico valor={telefone} onChange={setTelefone} />
          {erroLocal && <p className="text-red-400 text-sm mb-4 text-center">{erroLocal}</p>}
          <button
            type="button"
            disabled={buscandoNome}
            onClick={async () => {
              if (telefone.length < 10) {
                setErroLocal("Informe um telefone válido.");
                return;
              }
              setErroLocal("");
              setBuscandoNome(true);
              const info = await buscarClienteInfoPorTelefone(telefone, barbearia.id);
              setBuscandoNome(false);
              if (info.nome) {
                setNome(info.nome);
                setBoasVindas(true);
              } else {
                setNome("");
                setBoasVindas(false);
              }
              setClienteInfo(info);
              setEtapa(info.planoAtivo && !info.planoCobertoHoje ? "avisoPlano" : "nome");
            }}
            className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-lg py-4 transition-colors mt-6"
          >
            {buscandoNome ? "Verificando..." : "Continuar"}
          </button>
        </div>
      )}

      {etapa === "avisoPlano" && (
        <div>
          <div className="rounded-2xl border-4 border-red-500 bg-red-950/70 p-6 mb-6 text-center">
            <p className="text-red-400 text-3xl font-black mb-3 tracking-wide">⚠️ ATENÇÃO</p>
            <p className="text-white text-xl font-bold mb-2">
              Hoje o seu plano {clienteInfo?.planoAtivo} não cobre atendimento
              {clienteInfo?.planoDiasTexto ? ` (cobre ${clienteInfo.planoDiasTexto})` : ""}.
            </p>
            <p className="text-red-100 text-lg font-semibold">
              Para prosseguir, você vai pagar o corte avulso.
            </p>
          </div>
          <p className="text-white text-xl font-semibold mb-4 text-center">Você concorda?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEtapa("telefone");
                setTelefone("");
                setNome("");
                setBoasVindas(false);
                setClienteInfo(null);
              }}
              className="flex-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-bold text-lg py-4 transition-colors"
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => setEtapa("nome")}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 transition-colors"
            >
              Sim, concordo
            </button>
          </div>
        </div>
      )}

      {etapa === "nome" && (
        <div>
          <p className="text-white text-xl font-semibold mb-1 text-center">
            Como te chamamos?
          </p>
          {boasVindas && (
            <p className="text-orange-400 text-sm mb-3 text-center">
              Bem-vindo(a) de volta! Confirme ou edite seu nome abaixo.
            </p>
          )}
          {clienteInfo?.planoAtivo && clienteInfo.planoCobertoHoje && (
            <p className="text-green-400 text-sm font-semibold mb-3 text-center">
              🎫 Você tem o plano {clienteInfo.planoAtivo} ativo!
            </p>
          )}
          {clienteInfo?.planoAtivo && !clienteInfo.planoCobertoHoje && (
            <p className="text-amber-400 text-sm font-semibold mb-3 text-center px-2">
              🎫 Lembrete: hoje é avulso (plano {clienteInfo.planoAtivo} não cobre hoje).
            </p>
          )}
          <input
            type="text"
            autoFocus
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setBoasVindas(false);
            }}
            className={`w-full rounded-xl bg-white border text-neutral-900 text-2xl text-center px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              boasVindas ? "border-orange-400" : "border-neutral-300"
            }`}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("telefone")}
              className="rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-semibold px-6 py-4"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!nome.trim()) {
                  setErroLocal("Informe seu nome.");
                  return;
                }
                setErroLocal("");
                setEtapa("barbeiro");
              }}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {etapa === "barbeiro" && (
        <div>
          <p className="text-white text-xl font-semibold mb-4 text-center">
            Escolha seu barbeiro
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setBarbeiroPreferidoId(null);
                setEtapa("acompanhante");
              }}
              className="rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 overflow-hidden transition-colors"
            >
              <div className="w-full aspect-square bg-neutral-100 flex items-center justify-center text-6xl">
                🤝
              </div>
              <div className="py-2 bg-white">
                <span className="text-neutral-900 font-semibold text-sm">Sem preferência</span>
              </div>
            </button>

            {barbeiros.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => {
                  setBarbeiroPreferidoId(b.id);
                  setEtapa("acompanhante");
                }}
                className="rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 overflow-hidden transition-colors"
              >
                {b.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.fotoUrl} alt={b.nome} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-neutral-100 flex items-center justify-center text-6xl">
                    💈
                  </div>
                )}
                <div className="py-2 bg-white">
                  <span className="text-neutral-900 font-semibold text-sm">{b.nome}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setEtapa("nome")}
            className="rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-semibold px-6 py-4"
          >
            Voltar
          </button>
        </div>
      )}

      {etapa === "acompanhante" && (
        <form action={formAction}>
          <input type="hidden" name="telefone" value={telefone} />
          <input type="hidden" name="nome" value={nome} />
          <input type="hidden" name="barbeariaSlug" value={barbearia.slug} />
          {barbeiroPreferidoId && (
            <input type="hidden" name="barbeiroPreferidoId" value={barbeiroPreferidoId} />
          )}

          <p className="text-white text-xl font-semibold mb-1 text-center">
            Tem alguém com você?
          </p>
          <p className="text-neutral-300 text-sm mb-4 text-center">
            Se tiver alguém que também vai cortar o cabelo (mesmo sem celular), pode cadastrar aqui.
          </p>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setTemAcompanhante(false);
                setAcompanhanteNome("");
                setAcompanhanteTelefone("");
              }}
              className={`flex-1 rounded-xl border-2 py-4 font-semibold transition-colors ${
                temAcompanhante === false
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-white/20 text-neutral-200 hover:border-white/40"
              }`}
            >
              Não, só eu
            </button>
            <button
              type="button"
              onClick={() => setTemAcompanhante(true)}
              className={`flex-1 rounded-xl border-2 py-4 font-semibold transition-colors ${
                temAcompanhante === true
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-white/20 text-neutral-200 hover:border-white/40"
              }`}
            >
              Sim, tem alguém
            </button>
          </div>

          {temAcompanhante && (
            <div className="mb-4">
              <input
                type="text"
                name="acompanhanteNome"
                placeholder="Nome da pessoa"
                value={acompanhanteNome}
                onChange={(e) => setAcompanhanteNome(e.target.value)}
                className="w-full rounded-xl bg-white border border-neutral-300 text-neutral-900 text-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="tel"
                name="acompanhanteTelefone"
                placeholder="Celular (opcional)"
                value={acompanhanteTelefone}
                onChange={(e) => setAcompanhanteTelefone(e.target.value)}
                className="w-full rounded-xl bg-white border border-neutral-300 text-neutral-900 text-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {(erroLocal || estado.erro) && (
            <p className="text-red-400 text-sm mb-4 text-center">{erroLocal || estado.erro}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("barbeiro")}
              className="rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-semibold px-6 py-4"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pendente}
              onClick={(e) => {
                if (temAcompanhante && !acompanhanteNome.trim()) {
                  e.preventDefault();
                  setErroLocal("Informe o nome da pessoa que está com você.");
                }
              }}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-lg py-4 transition-colors"
            >
              {pendente ? "Entrando na fila..." : "Entrar na fila"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
