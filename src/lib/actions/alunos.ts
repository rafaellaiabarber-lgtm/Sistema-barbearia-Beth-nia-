"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashSenha, normalizarLogin } from "@/lib/auth";
import { requireUsuario } from "@/lib/session";
import type { FormState } from "./auth";

// Sem letras/números que se confundem (0/O, 1/I/L), pra ditar por WhatsApp sem erro.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function gerarCodigo(tamanho: number) {
  return Array.from({ length: tamanho }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

export type CriarAlunoState = FormState & { senhaGerada?: string; login?: string };

export async function criarAluno(_prev: CriarAlunoState, formData: FormData): Promise<CriarAlunoState> {
  await requireUsuario("INSTRUTOR");
  const nome = String(formData.get("nome") ?? "").trim();
  const login = normalizarLogin(String(formData.get("login") ?? ""));
  if (!nome || !login) return { erro: "Preencha nome e login (e-mail ou telefone)." };
  if (await prisma.usuario.findUnique({ where: { login } })) return { erro: "Já existe uma conta com esse login." };

  const senha = gerarCodigo(6);
  await prisma.usuario.create({ data: { nome, login, senhaHash: await hashSenha(senha) } });
  revalidatePath("/instrutor", "layout");
  return { sucesso: true, senhaGerada: senha, login };
}

/** Gera uma senha nova pro aluno que esqueceu a dele. Devolve a senha pra o instrutor repassar. */
export async function redefinirSenhaAluno(id: string): Promise<string | null> {
  await requireUsuario("INSTRUTOR");
  const senha = gerarCodigo(6);
  const { count } = await prisma.usuario.updateMany({
    where: { id, papel: "ALUNO" },
    data: { senhaHash: await hashSenha(senha) },
  });
  return count > 0 ? senha : null;
}

export async function alternarAlunoAtivo(id: string, ativo: boolean) {
  await requireUsuario("INSTRUTOR");
  await prisma.usuario.updateMany({ where: { id, papel: "ALUNO" }, data: { ativo } });
  revalidatePath("/", "layout");
}

export async function excluirAluno(id: string) {
  await requireUsuario("INSTRUTOR");
  await prisma.usuario.deleteMany({ where: { id, papel: "ALUNO" } });
  revalidatePath("/", "layout");
}

export async function gerarCodigoConvite() {
  await requireUsuario("INSTRUTOR");
  const codigoConvite = gerarCodigo(6);
  await prisma.configuracao.upsert({ where: { id: "unica" }, create: { codigoConvite }, update: { codigoConvite } });
  revalidatePath("/instrutor", "layout");
}

export async function desativarCodigoConvite() {
  await requireUsuario("INSTRUTOR");
  await prisma.configuracao.upsert({
    where: { id: "unica" },
    create: { codigoConvite: null },
    update: { codigoConvite: null },
  });
  revalidatePath("/instrutor", "layout");
}

export async function salvarNomeCurso(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUsuario("INSTRUTOR");
  const nomeCurso = String(formData.get("nomeCurso") ?? "").trim();
  if (!nomeCurso) return { erro: "Informe o nome do curso." };
  await prisma.configuracao.upsert({ where: { id: "unica" }, create: { nomeCurso }, update: { nomeCurso } });
  revalidatePath("/", "layout");
  return { sucesso: true };
}
