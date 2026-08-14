"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { TipoMaterial } from "@/lib/treinamento";

export type MaterialState = { erro?: string; sucesso?: boolean };

const TIPOS_VALIDOS: TipoMaterial[] = ["TEXTO", "LINK", "VIDEO"];

function validarCampos(formData: FormData): { erro: string } | { titulo: string; tipo: TipoMaterial; conteudo: string } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const conteudo = String(formData.get("conteudo") ?? "").trim();

  if (!titulo) return { erro: "Informe um título." };
  if (!TIPOS_VALIDOS.includes(tipo as TipoMaterial)) return { erro: "Tipo inválido." };
  if (!conteudo) return { erro: tipo === "TEXTO" ? "Informe o texto." : "Informe o link." };

  return { titulo, tipo: tipo as TipoMaterial, conteudo };
}

export async function criarMaterial(_prevState: MaterialState, formData: FormData): Promise<MaterialState> {
  await requireSession(["ADMIN"]);

  const campos = validarCampos(formData);
  if ("erro" in campos) return campos;

  const ultimo = await prisma.materialTreinamento.findFirst({ orderBy: { ordem: "desc" } });
  const ordem = (ultimo?.ordem ?? -1) + 1;

  await prisma.materialTreinamento.create({
    data: { titulo: campos.titulo, tipo: campos.tipo, conteudo: campos.conteudo, ordem },
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

  const campos = validarCampos(formData);
  if ("erro" in campos) return campos;

  await prisma.materialTreinamento.update({
    where: { id },
    data: { titulo: campos.titulo, tipo: campos.tipo, conteudo: campos.conteudo },
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
