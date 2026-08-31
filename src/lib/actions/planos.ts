"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type PlanoState = { erro?: string; sucesso?: boolean };

function revalidarPaginas() {
  revalidatePath("/admin/planos");
  revalidatePath("/admin/assinaturas");
  revalidatePath("/admin");
  revalidatePath("/fila");
}

export async function criarPlano(_prevState: PlanoState, formData: FormData): Promise<PlanoState> {
  const session = await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const preco = String(formData.get("preco") ?? "");
  const cota = Number(formData.get("cota") ?? 0);
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const linkExterno = String(formData.get("linkExterno") ?? "").trim() || null;

  if (!nome) return { erro: "Informe o nome do plano." };
  const precoCentavos = reaisParaCentavos(preco);
  if (precoCentavos <= 0) return { erro: "Informe um preço válido." };
  if (!Number.isFinite(cota) || cota <= 0) return { erro: "Informe uma cota de serviços válida." };

  await prisma.plano.create({
    data: {
      barbeariaId: session.barbeariaId,
      nome,
      precoCentavos,
      servicosIncluidosPorMes: Math.round(cota),
      diasSemana,
      linkExterno,
    },
  });

  revalidarPaginas();
  return { sucesso: true };
}

export async function atualizarPlano(
  id: string,
  _prevState: PlanoState,
  formData: FormData
): Promise<PlanoState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const preco = String(formData.get("preco") ?? "");
  const cota = Number(formData.get("cota") ?? 0);
  const diasSemana = formData.getAll("diasSemana").map(Number);

  if (!nome) return { erro: "Informe o nome do plano." };
  const precoCentavos = reaisParaCentavos(preco);
  if (precoCentavos <= 0) return { erro: "Informe um preço válido." };
  if (!Number.isFinite(cota) || cota <= 0) return { erro: "Informe uma cota de serviços válida." };

  await prisma.plano.update({
    where: { id },
    data: { nome, precoCentavos, servicosIncluidosPorMes: Math.round(cota), diasSemana },
  });

  revalidarPaginas();
  return { sucesso: true };
}

export async function salvarLinkExternoPlano(
  id: string,
  _prevState: PlanoState,
  formData: FormData
): Promise<PlanoState> {
  await requireSession(["ADMIN"]);

  const linkExterno = String(formData.get("linkExterno") ?? "").trim() || null;

  await prisma.plano.update({ where: { id }, data: { linkExterno } });

  revalidarPaginas();
  return { sucesso: true };
}

export async function alternarAtivoPlano(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.plano.update({ where: { id }, data: { ativo } });
  revalidarPaginas();
}

export async function excluirPlano(id: string) {
  await requireSession(["ADMIN"]);
  const emUso = await prisma.assinatura.findFirst({ where: { planoId: id } });
  if (emUso) {
    await prisma.plano.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.plano.delete({ where: { id } });
  }
  revalidarPaginas();
}
