"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ConfiguracaoTotemState = { erro?: string; sucesso?: boolean };

const CONFIGURACAO_ID = "singleton";
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

async function enviarImagem(pasta: string, arquivo: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return undefined;
  if (!arquivo.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
    throw new Error("A imagem deve ter no máximo 5MB.");
  }
  const blob = await put(`totem/${pasta}-${Date.now()}-${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function obterConfiguracaoTotem() {
  return prisma.configuracaoTotem.findUnique({ where: { id: CONFIGURACAO_ID } });
}

export async function atualizarLogoTotem(
  _prevState: ConfiguracaoTotemState,
  formData: FormData
): Promise<ConfiguracaoTotemState> {
  await requireSession(["ADMIN"]);

  try {
    const logoUrl = await enviarImagem("logo", formData.get("logo"));
    if (!logoUrl) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoTotem.upsert({
      where: { id: CONFIGURACAO_ID },
      create: { id: CONFIGURACAO_ID, logoUrl },
      update: { logoUrl },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }

  revalidatePath("/admin/totem");
  revalidatePath("/totem");
  return { sucesso: true };
}

export async function atualizarFundoTotem(
  _prevState: ConfiguracaoTotemState,
  formData: FormData
): Promise<ConfiguracaoTotemState> {
  await requireSession(["ADMIN"]);

  try {
    const fundoUrl = await enviarImagem("fundo", formData.get("fundo"));
    if (!fundoUrl) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoTotem.upsert({
      where: { id: CONFIGURACAO_ID },
      create: { id: CONFIGURACAO_ID, fundoUrl },
      update: { fundoUrl },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }

  revalidatePath("/admin/totem");
  revalidatePath("/totem");
  return { sucesso: true };
}

export async function removerLogoTotem() {
  await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { id: CONFIGURACAO_ID },
    create: { id: CONFIGURACAO_ID, logoUrl: null },
    update: { logoUrl: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}

export async function removerFundoTotem() {
  await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { id: CONFIGURACAO_ID },
    create: { id: CONFIGURACAO_ID, fundoUrl: null },
    update: { fundoUrl: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}
