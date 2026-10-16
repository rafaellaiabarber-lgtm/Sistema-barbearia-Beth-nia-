"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import {
  criarDesafio,
  criarModelosProntos,
  criarTecnica,
  
} from "@/lib/actions/cronometro";
import type { FormState } from "@/lib/actions/auth";

const estadoInicial: FormState = {};
const INPUT =
  "rounded-lg bg-neutral-900 border border-neutral-600 px-3 py-2 text-sm";
const BOTAO = "rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm";

export function NovaTecnicaForm() {
  const [estado, formAction, pendente] = useActionState(criarTecnica, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Nova técnica</label>
        <input name="nome" required placeholder="Ex.: Mid Fade" className={`${INPUT} w-56`} />
      </div>
      <button type="submit" disabled={pendente} className={BOTAO}>
        {pendente ? "Adicionando..." : "Adicionar"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}

export function NovoDesafioForm({ tecnicas }: { tecnicas: { id: string; nome: string }[] }) {
  const [estado, formAction, pendente] = useActionState(criarDesafio, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 shadow-sm"
    >
      <p className="font-semibold text-sm">Novo desafio</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Nome</label>
          <input name="titulo" required placeholder="Ex.: 7 dias abaixo de 35 minutos" className={`${INPUT} w-64`} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Técnica</label>
          <select name="tecnicaId" className={INPUT} defaultValue="">
            <option value="">Qualquer corte</option>
            {tecnicas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Média abaixo de (min)</label>
          <input name="metaMinutos" type="number" min={1} max={240} required defaultValue={35} className={`${INPUT} w-28`} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Dias seguidos</label>
          <input name="diasSeguidos" type="number" min={1} max={90} required defaultValue={7} className={`${INPUT} w-24`} />
        </div>
      </div>
      <button type="submit" disabled={pendente} className={BOTAO}>
        {pendente ? "Criando..." : "Criar desafio"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm">{estado.erro}</p>}
    </form>
  );
}

export function ModelosProntosButton() {
  const [pendente, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() => startTransition(() => criarModelosProntos())}
      className="rounded-lg border border-orange-500 text-orange-300 hover:bg-orange-500/10 disabled:opacity-60 font-semibold px-4 py-2 text-sm"
    >
      {pendente ? "Criando..." : "Usar modelos prontos (Low, Mid e High Fade + desafios)"}
    </button>
  );
}
