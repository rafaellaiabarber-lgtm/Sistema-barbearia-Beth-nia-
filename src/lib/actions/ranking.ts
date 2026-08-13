"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ConfiguracaoRankingState = { erro?: string; sucesso?: boolean };

function pontosInteiro(formData: FormData, campo: string) {
  const valor = Number.parseInt(String(formData.get(campo) ?? "0"), 10);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function premioTexto(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor || null;
}

function inteiroOuNulo(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  if (!valor) return null;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

export async function atualizarConfiguracaoRanking(
  _prevState: ConfiguracaoRankingState,
  formData: FormData
): Promise<ConfiguracaoRankingState> {
  await requireSession(["ADMIN"]);

  const dados = {
    pontosPorAtendimento: pontosInteiro(formData, "pontosPorAtendimento"),
    pontosPorVendaProduto: pontosInteiro(formData, "pontosPorVendaProduto"),
    pontosPorAssinatura: pontosInteiro(formData, "pontosPorAssinatura"),
    pontosPorIndicacaoConvertida: pontosInteiro(formData, "pontosPorIndicacaoConvertida"),
    premio1LugarSemanal: premioTexto(formData, "premio1LugarSemanal"),
    premio2LugarSemanal: premioTexto(formData, "premio2LugarSemanal"),
    premio3LugarSemanal: premioTexto(formData, "premio3LugarSemanal"),
    premio1LugarMensal: premioTexto(formData, "premio1LugarMensal"),
    premio2LugarMensal: premioTexto(formData, "premio2LugarMensal"),
    premio3LugarMensal: premioTexto(formData, "premio3LugarMensal"),
    pontuacaoMinimaPremio: inteiroOuNulo(formData, "pontuacaoMinimaPremio"),
  };

  await prisma.configuracaoRanking.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...dados },
    update: dados,
  });

  revalidatePath("/ranking");
  return { sucesso: true };
}
