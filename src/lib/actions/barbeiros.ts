"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hashSenha } from "@/lib/auth";
import { reaisParaCentavos } from "@/lib/format";

export type BarbeiroState = { erro?: string; sucesso?: boolean };

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

async function enviarFoto(barbeiroId: string, foto: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(foto instanceof File) || foto.size === 0) return undefined;
  if (!foto.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (foto.size > TAMANHO_MAXIMO_FOTO) {
    throw new Error("A imagem deve ter no máximo 5MB.");
  }
  const blob = await put(`barbeiros/${barbeiroId}-${Date.now()}-${foto.name}`, foto, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function criarBarbeiro(_prevState: BarbeiroState, formData: FormData): Promise<BarbeiroState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const comissao = Number(formData.get("comissao") ?? 50);
  const login = String(formData.get("login") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) return { erro: "Informe o nome do barbeiro." };
  if (!login) return { erro: "Informe um usuário de login." };
  if (!senha || senha.length < 4) return { erro: "A senha deve ter ao menos 4 caracteres." };

  const loginExistente = await prisma.usuario.findUnique({ where: { login } });
  if (loginExistente) return { erro: "Esse usuário já existe." };

  const barbeiro = await prisma.barbeiro.create({
    data: {
      nome,
      telefone: telefone || null,
      comissaoPercentual: comissao,
    },
  });

  try {
    const fotoUrl = await enviarFoto(barbeiro.id, formData.get("foto"));
    if (fotoUrl) {
      await prisma.barbeiro.update({ where: { id: barbeiro.id }, data: { fotoUrl } });
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a foto." };
  }

  await prisma.usuario.create({
    data: {
      nome,
      login,
      senhaHash: await hashSenha(senha),
      role: "BARBEIRO",
      barbeiroId: barbeiro.id,
    },
  });

  revalidatePath("/admin/barbeiros");
  revalidatePath("/totem");
  return {};
}

export async function atualizarBarbeiro(
  id: string,
  _prevState: BarbeiroState,
  formData: FormData
): Promise<BarbeiroState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const comissao = Number(formData.get("comissao") ?? 50);

  if (!nome) return { erro: "Informe o nome do barbeiro." };
  if (Number.isNaN(comissao) || comissao < 0 || comissao > 100) {
    return { erro: "Comissão deve ser um número entre 0 e 100." };
  }

  await prisma.barbeiro.update({
    where: { id },
    data: { nome, telefone: telefone || null, comissaoPercentual: comissao },
  });

  revalidatePath("/admin/barbeiros");
  revalidatePath("/totem");
  return { sucesso: true };
}

export async function atualizarMetaBonificacao(
  id: string,
  _prevState: BarbeiroState,
  formData: FormData
): Promise<BarbeiroState> {
  await requireSession(["ADMIN"]);

  const meta = String(formData.get("meta") ?? "").trim();
  const bonificacao = String(formData.get("bonificacao") ?? "").trim();

  const metaCentavos = meta ? reaisParaCentavos(meta) : null;
  if (metaCentavos !== null && metaCentavos < 0) return { erro: "Informe uma meta válida." };

  const bonificacaoCentavos = bonificacao ? reaisParaCentavos(bonificacao) : null;
  if (bonificacaoCentavos !== null && bonificacaoCentavos < 0) {
    return { erro: "Informe uma bonificação válida." };
  }

  await prisma.barbeiro.update({
    where: { id },
    data: { metaFaturamentoCentavos: metaCentavos, bonificacaoCentavos },
  });

  revalidatePath("/admin/barbeiros");
  return { sucesso: true };
}

export async function alternarAtivoBarbeiro(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.barbeiro.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/barbeiros");
  revalidatePath("/totem");
}

export async function excluirBarbeiro(id: string) {
  await requireSession(["ADMIN"]);

  const [temAtendimento, temPreferido, temComissao] = await Promise.all([
    prisma.atendimento.findFirst({ where: { barbeiroId: id } }),
    prisma.atendimento.findFirst({ where: { barbeiroPreferidoId: id } }),
    prisma.pagamentoComissao.findFirst({ where: { barbeiroId: id } }),
  ]);

  if (temAtendimento || temPreferido || temComissao) {
    await prisma.barbeiro.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.usuario.deleteMany({ where: { barbeiroId: id } });
    await prisma.barbeiro.delete({ where: { id } });
  }

  revalidatePath("/admin/barbeiros");
  revalidatePath("/totem");
}

export async function atualizarFotoBarbeiro(
  barbeiroId: string,
  _prevState: BarbeiroState,
  formData: FormData
): Promise<BarbeiroState> {
  await requireSession(["ADMIN"]);

  try {
    const fotoUrl = await enviarFoto(barbeiroId, formData.get("foto"));
    if (!fotoUrl) return { erro: "Escolha uma imagem." };
    await prisma.barbeiro.update({ where: { id: barbeiroId }, data: { fotoUrl } });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao enviar a foto." };
  }

  revalidatePath("/admin/barbeiros");
  revalidatePath("/totem");
  return {};
}
