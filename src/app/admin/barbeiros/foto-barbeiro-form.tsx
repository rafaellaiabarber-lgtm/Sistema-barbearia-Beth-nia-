"use client";

import { useActionState, useRef, useEffect } from "react";
import { atualizarFotoBarbeiro, type BarbeiroState } from "@/lib/actions/barbeiros";

const estadoInicial: BarbeiroState = {};

export function FotoBarbeiroForm({ barbeiroId, nome, fotoUrl }: { barbeiroId: string; nome: string; fotoUrl: string | null }) {
  const acaoComId = atualizarFotoBarbeiro.bind(null, barbeiroId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
    }
  }, [estado, pendente]);

  return (
    <div className="flex items-center gap-2">
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt={nome} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-lg">
          💈
        </div>
      )}
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          name="foto"
          accept="image/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pendente}
          className="text-xs text-neutral-400 hover:text-amber-400 disabled:opacity-60"
        >
          {pendente ? "Enviando..." : fotoUrl ? "Trocar foto" : "Adicionar foto"}
        </button>
      </form>
      {estado.erro && <p className="text-red-400 text-xs">{estado.erro}</p>}
    </div>
  );
}
