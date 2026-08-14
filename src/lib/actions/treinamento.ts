"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { TipoMaterial } from "@/lib/treinamento";

export type MaterialState = { erro?: string; sucesso?: boolean };

const TIPOS_VALIDOS: TipoMaterial[] = ["TEXTO", "LINK", "VIDEO", "ARQUIVO"];
const TAMANHO_MAXIMO_ARQUIVO = 20 * 1024 * 1024;

async function enviarArquivo(arquivo: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return undefined;
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new Error("O arquivo deve ter no máximo 20MB.");
  }
  const blob = await put(`treinamento/${Date.now()}-${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

async function extrairConteudo(
  formData: FormData,
  tipo: TipoMaterial,
  conteudoAtual?: string
): Promise<{ conteudo: string } | { erro: string }> {
  if (tipo === "ARQUIVO") {
    try {
      const url = await enviarArquivo(formData.get("arquivo"));
      if (url) return { conteudo: url };
      if (conteudoAtual) return { conteudo: conteudoAtual };
      return { erro: "Escolha um arquivo." };
    } catch (e) {
      return { erro: e instanceof Error ? e.message : "Falha ao enviar o arquivo." };
    }
  }

  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return { erro: tipo === "TEXTO" ? "Informe o texto." : "Informe o link." };
  return { conteudo };
}

export async function criarMaterial(_prevState: MaterialState, formData: FormData): Promise<MaterialState> {
  await requireSession(["ADMIN"]);

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  if (!titulo) return { erro: "Informe um título." };
  if (!TIPOS_VALIDOS.includes(tipo as TipoMaterial)) return { erro: "Tipo inválido." };

  const resultado = await extrairConteudo(formData, tipo as TipoMaterial);
  if ("erro" in resultado) return resultado;

  const ultimo = await prisma.materialTreinamento.findFirst({ orderBy: { ordem: "desc" } });
  const ordem = (ultimo?.ordem ?? -1) + 1;

  await prisma.materialTreinamento.create({
    data: { titulo, tipo: tipo as TipoMaterial, conteudo: resultado.conteudo, ordem },
  });

  revalidatePath("/admin/treinamento");
  revalidatePath("/treinamento");
  return { sucesso: true };
}

export async function atualizarMaterial(
  id: string,
  _prevState: MaterialState,
  formData: FormData
): Promise<MaterialState> {
  await requireSession(["ADMIN"]);

  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  if (!titulo) return { erro: "Informe um título." };
  if (!TIPOS_VALIDOS.includes(tipo as TipoMaterial)) return { erro: "Tipo inválido." };

  const materialAtual = await prisma.materialTreinamento.findUnique({ where: { id } });
  const conteudoAtual = materialAtual?.tipo === tipo ? materialAtual.conteudo : undefined;

  const resultado = await extrairConteudo(formData, tipo as TipoMaterial, conteudoAtual);
  if ("erro" in resultado) return resultado;

  await prisma.materialTreinamento.update({
    where: { id },
    data: { titulo, tipo: tipo as TipoMaterial, conteudo: resultado.conteudo },
  });

  revalidatePath("/admin/treinamento");
  revalidatePath("/treinamento");
  return { sucesso: true };
}

export async function excluirMaterial(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.materialTreinamento.delete({ where: { id } });
  revalidatePath("/admin/treinamento");
  revalidatePath("/treinamento");
}

export async function moverMaterial(id: string, direcao: "cima" | "baixo") {
  await requireSession(["ADMIN"]);

  const materiais = await prisma.materialTreinamento.findMany({ orderBy: { ordem: "asc" } });
  const index = materiais.findIndex((m) => m.id === id);
  if (index === -1) return;

  const alvo = direcao === "cima" ? index - 1 : index + 1;
  if (alvo < 0 || alvo >= materiais.length) return;

  const atual = materiais[index];
  const vizinho = materiais[alvo];

  await prisma.$transaction([
    prisma.materialTreinamento.update({ where: { id: atual.id }, data: { ordem: vizinho.ordem } }),
    prisma.materialTreinamento.update({ where: { id: vizinho.id }, data: { ordem: atual.ordem } }),
  ]);

  revalidatePath("/admin/treinamento");
  revalidatePath("/treinamento");
}
