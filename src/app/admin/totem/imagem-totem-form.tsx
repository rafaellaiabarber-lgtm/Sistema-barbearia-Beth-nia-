"use client";

import { useActionState, useRef, useEffect } from "react";
import type { ConfiguracaoTotemState } from "@/lib/actions/totem";

const estadoInicial: ConfiguracaoTotemState = {};

export function ImagemTotemForm({
  campo,
  label,
  descricao,
  imagemUrl,
  aspecto,
  acao,
  acaoRemover,
}: {
  campo: string;
  label: string;
  descricao: string;
  imagemUrl: string | null;
  aspecto: "logo" | "fundo";
  acao: (prevState: ConfiguracaoTotemState, formData: FormData) => Promise<ConfiguracaoTotemState>;
  acaoRemover: () => Promise<void>;
}) {
  const [estado, formAction, pendente] = useActionState(acao, estadoInicial);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
    }
  }, [estado, pendente]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold mb-1">{label}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{descricao}</p>

      {imagemUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagemUrl}
          alt={label}
          className={
            aspecto === "logo"
              ? "h-24 object-contain bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-2 mb-4"
              : "w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-800 mb-4"
          }
        />
      ) : (
        <div className="w-full h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm mb-4">
          Nenhuma imagem definida
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" name={campo} accept="image/*" className="hidden" onChange={() => formRef.current?.requestSubmit()} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pendente}
          className="text-sm rounded-lg bg-lime-600 hover:bg-lime-700 disabled:opacity-60 text-slate-950 font-semibold px-3 py-2"
        >
          {pendente ? "Enviando..." : imagemUrl ? "Trocar imagem" : "Enviar imagem"}
        </button>
        {imagemUrl && (
          <button
            type="button"
            onClick={() => acaoRemover()}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600"
          >
            Remover
          </button>
        )}
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
