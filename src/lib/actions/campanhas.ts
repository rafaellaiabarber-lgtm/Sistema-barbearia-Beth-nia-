"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type CampanhaState = { erro?: string };

function revalidar() {
  revalidatePath("/admin/campanhas");
  revalidatePath("/fila");
  revalidatePath("/ranking");
}

export async function criarCampanha(_prevState: CampanhaState, formData: FormData): Promise<CampanhaState> {
  await requireSession(["ADMIN"]);

  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const selecoes = formData.getAll("itemSelecao").map(String);
  const quantidades = formData.getAll("itemQuantidade").map(String);

  if (!barbeiroId) return { erro: "Escolha o barbeiro." };
  if (selecoes.length === 0) return { erro: "Adicione ao menos um item na lista." };

  const itens: { produtoId?: string; servicoId?: string; quantidadeAlvo: number }[] = [];
  for (let i = 0; i < selecoes.length; i++) {
    const [tipo, id] = selecoes[i].split(":");
    if (!tipo || !id) return { erro: `Escolha um produto ou serviço pro item ${i + 1}.` };

    const quantidadeAlvo = Number.parseInt(quantidades[i] ?? "", 10);
    if (!Number.isFinite(quantidadeAlvo) || quantidadeAlvo <= 0) {
      return { erro: `Informe uma quantidade válida pro item ${i + 1}.` };
    }

    if (tipo === "produto") itens.push({ produtoId: id, quantidadeAlvo });
    else if (tipo === "servico") itens.push({ servicoId: id, quantidadeAlvo });
    else return { erro: `Item ${i + 1} inválido.` };
  }

  const barbeiro = await prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true } });
  if (!barbeiro) return { erro: "Barbeiro inválido." };

  await prisma.campanhaVenda.create({
    data: {
      barbeiroId,
      titulo: titulo || null,
      itens: { create: itens },
    },
  });

  revalidar();
  return {};
}

export async function alternarAtivaCampanha(id: string, ativa: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.campanhaVenda.update({ where: { id }, data: { ativa } });
  revalidar();
}

export async function excluirCampanha(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.campanhaVenda.delete({ where: { id } });
  revalidar();
}
