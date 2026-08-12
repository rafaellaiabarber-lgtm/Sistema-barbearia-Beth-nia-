"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { salvarFundoTotem, removerFundoTotem } from "@/lib/actions/totem";

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
const TAMANHO_MAXIMO_VIDEO = 40 * 1024 * 1024;

export function FundoTotemForm({ fundoUrl, fundoTipo }: { fundoUrl: string | null; fundoTipo: string | null }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ehVideo = fundoTipo === "video";

  async function enviar(arquivo: File) {
    setErro(null);

    const ehImagem = arquivo.type.startsWith("image/");
    const ehVideoArquivo = arquivo.type.startsWith("video/");
    if (!ehImagem && !ehVideoArquivo) {
      setErro("O arquivo precisa ser uma imagem ou um vídeo.");
      return;
    }
    const tamanhoMaximo = ehVideoArquivo ? TAMANHO_MAXIMO_VIDEO : TAMANHO_MAXIMO_IMAGEM;
    if (arquivo.size > tamanhoMaximo) {
      setErro(
        ehVideoArquivo ? "O vídeo deve ter no máximo 40MB — use um vídeo curto, em loop." : "A imagem deve ter no máximo 5MB."
      );
      return;
    }

    setPendente(true);
    try {
      const blob = await upload(`totem/fundo-${Date.now()}-${arquivo.name}`, arquivo, {
        access: "public",
        handleUploadUrl: "/api/upload/totem",
      });
      await salvarFundoTotem(blob.url, ehVideoArquivo ? "video" : "imagem");
    } catch {
      setErro("Falha ao enviar o arquivo. Tente novamente.");
    } finally {
      setPendente(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

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

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) enviar(arquivo);
          }}
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
        {erro && <p className="text-red-600 text-sm w-full">{erro}</p>}
        <p className="text-slate-400 text-xs w-full">
          Imagem: até 5MB. Vídeo: até 40MB — prefira um vídeo curto (10-20s) em loop, sem som.
        </p>
      </div>
    </div>
  );
}
