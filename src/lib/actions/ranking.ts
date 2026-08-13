"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type ConfiguracaoRankingState = { erro?: string; sucesso?: boolean };

function pontosInteiro(formData: FormData, campo: string) {
  const valor = Number.parseInt(String(formData.get(campo) ?? "0"), 10);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function premioCentavos(formData: FormData, campo: string) {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor ? reaisParaCentavos(valor) : null;
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
    premio1LugarSemanalCentavos: premioCentavos(formData, "premio1LugarSemanal"),
    premio2LugarSemanalCentavos: premioCentavos(formData, "premio2LugarSemanal"),
    premio3LugarSemanalCentavos: premioCentavos(formData, "premio3LugarSemanal"),
    premio1LugarMensalCentavos: premioCentavos(formData, "premio1LugarMensal"),
    premio2LugarMensalCentavos: premioCentavos(formData, "premio2LugarMensal"),
    premio3LugarMensalCentavos: premioCentavos(formData, "premio3LugarMensal"),
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
