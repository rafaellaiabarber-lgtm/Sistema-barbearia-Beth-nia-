"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { hashSenha } from "@/lib/auth";

export type BarbeiroState = { erro?: string };

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
  return {};
}

export async function alternarAtivoBarbeiro(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.barbeiro.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/barbeiros");
}
