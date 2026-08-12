"use client";

import { useActionState, useRef, useEffect } from "react";
import { atualizarFundoTotem, removerFundoTotem, type ConfiguracaoTotemState } from "@/lib/actions/totem";

const estadoInicial: ConfiguracaoTotemState = {};

export function FundoTotemForm({ fundoUrl, fundoTipo }: { fundoUrl: string | null; fundoTipo: string | null }) {
  const [estado, formAction, pendente] = useActionState(atualizarFundoTotem, estadoInicial);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
    }
  }, [estado, pendente]);

  const ehVideo = fundoTipo === "video";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold mb-1">Fundo (imagem ou vídeo)</h2>
      <p className="text-slate-500 text-sm mb-4">Exibido atrás da tela do totem. Pode ser uma foto ou um vídeo curto em loop.</p>

      {fundoUrl ? (
        ehVideo ? (
          <video
            src={fundoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-40 object-cover rounded-lg border border-slate-200 mb-4"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fundoUrl} alt="Fundo do totem" className="w-full h-40 object-cover rounded-lg border border-slate-200 mb-4" />
        )
      ) : (
        <div className="w-full h-24 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm mb-4">
          Nenhum fundo definido
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="fundo"
          accept="image/*,video/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pendente}
          className="text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 py-2"
        >
          {pendente ? "Enviando..." : fundoUrl ? "Trocar fundo" : "Enviar imagem ou vídeo"}
        </button>
        {fundoUrl && (
          <button type="button" onClick={() => removerFundoTotem()} className="text-sm text-slate-500 hover:text-red-600">
            Remover
          </button>
        )}
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        <p className="text-slate-400 text-xs w-full">
          Imagem: até 5MB. Vídeo: até 40MB — prefira um vídeo curto (10-20s) em loop, sem som.
        </p>
      </form>
    </div>
  );
}
