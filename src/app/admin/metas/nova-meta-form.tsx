"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import type { Barbeiro } from "@prisma/client";
import { salvarMeta, type MetaState } from "@/lib/actions/metas";
import { LABEL_TIPO_META } from "@/lib/metas";
import { NivelInputs } from "./nivel-inputs";

const estadoInicial: MetaState = {};

export function NovaMetaForm({ barbeiros }: { barbeiros: Barbeiro[] }) {
  const [estado, formAction, pendente] = useActionState(salvarMeta, estadoInicial);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [tipo, setTipo] = useState("FATURAMENTO");
  const formRef = useRef<HTMLFormElement>(null);
  const barbeiroSelectRef = useRef<HTMLSelectElement>(null);
  const tipoSelectRef = useRef<HTMLSelectElement>(null);
  const valoresRef = useRef({ barbeiroId, tipo });
  valoresRef.current = { barbeiroId, tipo };

  useEffect(() => {
    if (estado.erro) {
      // React reseta os campos do <form> após a action rodar, mesmo quando ela retorna
      // um erro de validação. Reaplica o valor controlado nos <select> pra não perder a
      // escolha do barbeiro/tipo (e travar ou distorcer o reenvio).
      if (barbeiroSelectRef.current) barbeiroSelectRef.current.value = valoresRef.current.barbeiroId;
      if (tipoSelectRef.current) tipoSelectRef.current.value = valoresRef.current.tipo;
      return;
    }
    if (!pendente) {
      formRef.current?.reset();
      setBarbeiroId("");
      setTipo("FATURAMENTO");
    }
  }, [estado, pendente]);

  return (
    <details className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 select-none">Nova meta</summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Barbeiro</label>
            <select
              ref={barbeiroSelectRef}
              name="barbeiroId"
              required
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm"
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
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo de meta</label>
            <select
              ref={tipoSelectRef}
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(LABEL_TIPO_META).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-slate-500 text-xs mb-2">
          Cada nível precisa de um alvo maior que o anterior (ex.: Bronze R$3.000, Prata R$5.000, Ouro R$8.000).
        </p>
        <NivelInputs key={tipo} tipo={tipo} />

        {estado.erro && <p className="text-red-600 text-sm mt-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Salvando..." : "Salvar meta"}
        </button>
      </form>
    </details>
  );
}
