"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { salvarLogoTotem, removerLogoTotem } from "@/lib/actions/totem";

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

export function LogoTotemForm({ logoUrl }: { logoUrl: string | null }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    setErro(null);

    if (!arquivo.type.startsWith("image/")) {
      setErro("O arquivo precisa ser uma imagem.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      setErro("A imagem deve ter no máximo 5MB.");
      return;
    }

    setPendente(true);
    try {
      const blob = await upload(`totem/logo-${Date.now()}-${arquivo.name}`, arquivo, {
        access: "public",
        handleUploadUrl: "/api/upload/totem",
      });
      await salvarLogoTotem(blob.url);
    } catch {
      setErro("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setPendente(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold mb-1">Logo</h2>
      <p className="text-slate-500 text-sm mb-4">Exibida no topo da tela do totem, no lugar do nome da barbearia.</p>

      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Logo" className="h-24 object-contain bg-slate-50 rounded-lg border border-slate-200 p-2 mb-4" />
      ) : (
        <div className="w-full h-24 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm mb-4">
          Nenhuma imagem definida
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
          {pendente ? "Enviando..." : logoUrl ? "Trocar imagem" : "Enviar imagem"}
        </button>
        {logoUrl && (
          <button type="button" onClick={() => removerLogoTotem()} className="text-sm text-slate-500 hover:text-red-600">
            Remover
          </button>
        )}
        {erro && <p className="text-red-600 text-sm w-full">{erro}</p>}
      </div>
    </div>
  );
}
