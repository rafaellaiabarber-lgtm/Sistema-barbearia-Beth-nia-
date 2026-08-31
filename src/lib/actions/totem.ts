"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ConfiguracaoTotemState = { erro?: string; sucesso?: boolean };

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

export async function obterConfiguracaoTotem(barbeariaId: string) {
  return prisma.configuracaoTotem.findUnique({ where: { barbeariaId } });
}

export async function atualizarLogoTotem(
  _prevState: ConfiguracaoTotemState,
  formData: FormData
): Promise<ConfiguracaoTotemState> {
  const session = await requireSession(["ADMIN"]);

  try {
    const logoUrl = await enviarImagem("logo", formData.get("logo"));
    if (!logoUrl) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoTotem.upsert({
      where: { barbeariaId: session.barbeariaId },
      create: { barbeariaId: session.barbeariaId, logoUrl },
      update: { logoUrl },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }

  revalidatePath("/admin/totem");
  revalidatePath("/totem");
  return { sucesso: true };
}

export async function atualizarLogoMenu(
  _prevState: ConfiguracaoTotemState,
  formData: FormData
): Promise<ConfiguracaoTotemState> {
  const session = await requireSession(["ADMIN"]);

  try {
    const logoMenuUrl = await enviarImagem("logo-menu", formData.get("logoMenu"));
    if (!logoMenuUrl) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoTotem.upsert({
      where: { barbeariaId: session.barbeariaId },
      create: { barbeariaId: session.barbeariaId, logoMenuUrl },
      update: { logoMenuUrl },
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a imagem." };
  }

  revalidatePath("/admin/totem");
  revalidatePath("/", "layout");
  return { sucesso: true };
}

export async function removerLogoMenu() {
  const session = await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, logoMenuUrl: null },
    update: { logoMenuUrl: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/", "layout");
}

export async function atualizarFundoTotem(
  _prevState: ConfiguracaoTotemState,
  formData: FormData
): Promise<ConfiguracaoTotemState> {
  const session = await requireSession(["ADMIN"]);

  try {
    const fundoUrl = await enviarImagem("fundo", formData.get("fundo"));
    if (!fundoUrl) return { erro: "Escolha uma imagem." };
    await prisma.configuracaoTotem.upsert({
      where: { barbeariaId: session.barbeariaId },
      create: { barbeariaId: session.barbeariaId, fundoUrl },
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
  const session = await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, logoUrl: null },
    update: { logoUrl: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}

export async function removerFundoTotem() {
  const session = await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, fundoUrl: null },
    update: { fundoUrl: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}
