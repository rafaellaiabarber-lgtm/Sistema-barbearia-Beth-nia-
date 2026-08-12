"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ConfiguracaoTotemState = { erro?: string; sucesso?: boolean };

const CONFIGURACAO_ID = "singleton";

export async function obterConfiguracaoTotem() {
  return prisma.configuracaoTotem.findUnique({ where: { id: CONFIGURACAO_ID } });
}

// Ambas as funções abaixo são usadas depois de um upload direto-do-navegador pro
// Vercel Blob (ver /api/upload/totem) — o arquivo já está salvo lá, aqui só
// persiste a URL. Enviar o arquivo direto do navegador (em vez de por uma Server
// Action) evita o limite de payload de 4,5MB que a Vercel aplica a toda função
// serverless, independente de qualquer configuração do Next.js.
export async function salvarLogoTotem(logoUrl: string) {
  await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { id: CONFIGURACAO_ID },
    create: { id: CONFIGURACAO_ID, logoUrl },
    update: { logoUrl },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}

export async function salvarFundoTotem(fundoUrl: string, fundoTipo: "imagem" | "video") {
  await requireSession(["ADMIN"]);
  await prisma.configuracaoTotem.upsert({
    where: { id: CONFIGURACAO_ID },
    create: { id: CONFIGURACAO_ID, fundoUrl, fundoTipo },
    update: { fundoUrl, fundoTipo },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
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
    create: { id: CONFIGURACAO_ID, fundoUrl: null, fundoTipo: null },
    update: { fundoUrl: null, fundoTipo: null },
  });
  revalidatePath("/admin/totem");
  revalidatePath("/totem");
}
