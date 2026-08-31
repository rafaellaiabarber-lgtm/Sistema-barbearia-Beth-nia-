"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";

const CONFIGURACAO_ID = "plataforma";
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

export type ConfiguracaoPlataformaState = { erro?: string; sucesso?: boolean };

async function enviarImagem(pasta: string, arquivo: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return undefined;
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
    throw new Error("A imagem deve ter no máximo 5MB.");
  }
  const blob = await put(`plataforma/${pasta}-${Date.now()}-${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function obterConfiguracaoPlataforma() {
  return prisma.configuracaoPlataforma.findUnique({ where: { id: CONFIGURACAO_ID } });
}

async function atualizarFoto(campo: "fotoHeroUrl" | "fotoGaleria1Url" | "fotoGaleria2Url" | "fotoGaleria3Url", formData: FormData): Promise<ConfiguracaoPlataformaState> {
  await requireDonoPlataforma();

  try {
    const url = await enviarImagem(campo, formData.get(campo));
    if (!url) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoPlataforma.upsert({
      where: { id: CONFIGURACAO_ID },
      create: { id: CONFIGURACAO_ID, [campo]: url },
      update: { [campo]: url },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }

  revalidatePath("/dono/pagina-de-vendas");
  revalidatePath("/");
  return { sucesso: true };
}

async function removerFoto(campo: "fotoHeroUrl" | "fotoGaleria1Url" | "fotoGaleria2Url" | "fotoGaleria3Url") {
  await requireDonoPlataforma();
  await prisma.configuracaoPlataforma.upsert({
    where: { id: CONFIGURACAO_ID },
    create: { id: CONFIGURACAO_ID, [campo]: null },
    update: { [campo]: null },
  });
  revalidatePath("/dono/pagina-de-vendas");
  revalidatePath("/");
}

export async function atualizarFotoHero(_prevState: ConfiguracaoPlataformaState, formData: FormData) {
  return atualizarFoto("fotoHeroUrl", formData);
}
export async function removerFotoHero() {
  return removerFoto("fotoHeroUrl");
}

export async function atualizarFotoGaleria1(_prevState: ConfiguracaoPlataformaState, formData: FormData) {
  return atualizarFoto("fotoGaleria1Url", formData);
}
export async function removerFotoGaleria1() {
  return removerFoto("fotoGaleria1Url");
}

export async function atualizarFotoGaleria2(_prevState: ConfiguracaoPlataformaState, formData: FormData) {
  return atualizarFoto("fotoGaleria2Url", formData);
}
export async function removerFotoGaleria2() {
  return removerFoto("fotoGaleria2Url");
}

export async function atualizarFotoGaleria3(_prevState: ConfiguracaoPlataformaState, formData: FormData) {
  return atualizarFoto("fotoGaleria3Url", formData);
}
export async function removerFotoGaleria3() {
  return removerFoto("fotoGaleria3Url");
}
