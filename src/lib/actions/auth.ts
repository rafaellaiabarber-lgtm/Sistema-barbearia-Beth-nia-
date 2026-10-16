"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha, normalizarLogin, verificarSenha } from "@/lib/auth";
import { encerrarSessao, iniciarSessao, requireUsuario } from "@/lib/session";

export type FormState = { erro?: string; sucesso?: boolean };

const SENHA_MINIMA = 6;

export async function entrar(_prev: FormState, formData: FormData): Promise<FormState> {
  const login = normalizarLogin(String(formData.get("login") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  if (!login || !senha) return { erro: "Preencha login e senha." };

  const usuario = await prisma.usuario.findUnique({ where: { login } });
  if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) {
    return { erro: "Login ou senha inválidos." };
  }
  if (!usuario.ativo) return { erro: "Seu acesso está bloqueado. Fale com o instrutor do curso." };

  await iniciarSessao(usuario.id);
  redirect("/cronometro");
}

export async function sair() {
  await encerrarSessao();
  redirect("/entrar");
}

/** Primeiro acesso: só funciona enquanto não existe nenhum usuário. Cria a conta do instrutor. */
export async function criarInstrutor(_prev: FormState, formData: FormData): Promise<FormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const login = normalizarLogin(String(formData.get("login") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const nomeCurso = String(formData.get("nomeCurso") ?? "").trim();
  if (!nome || !login) return { erro: "Preencha nome e login." };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const usuario = await prisma.$transaction(async (tx) => {
    if ((await tx.usuario.count()) > 0) return null;
    if (nomeCurso) {
      await tx.configuracao.upsert({ where: { id: "unica" }, create: { nomeCurso }, update: { nomeCurso } });
    }
    return tx.usuario.create({ data: { nome, login, senhaHash: await hashSenha(senha), papel: "INSTRUTOR" } });
  });
  if (!usuario) return { erro: "O app já foi configurado. Entre com sua conta." };

  await iniciarSessao(usuario.id);
  redirect("/instrutor/tecnicas");
}

/** Aluno cria a própria conta usando o código do curso que o instrutor passou. */
export async function cadastrarComCodigo(_prev: FormState, formData: FormData): Promise<FormState> {
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  const nome = String(formData.get("nome") ?? "").trim();
  const login = normalizarLogin(String(formData.get("login") ?? ""));
  const senha = String(formData.get("senha") ?? "");

  const config = await prisma.configuracao.findUnique({ where: { id: "unica" } });
  if (!config?.codigoConvite || config.codigoConvite !== codigo) {
    return { erro: "Código do curso inválido. Confira com o instrutor." };
  }
  if (!nome || !login) return { erro: "Preencha nome e login." };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  if (await prisma.usuario.findUnique({ where: { login } })) {
    return { erro: "Já existe uma conta com esse login. Tente entrar." };
  }

  const usuario = await prisma.usuario.create({ data: { nome, login, senhaHash: await hashSenha(senha) } });
  await iniciarSessao(usuario.id);
  redirect("/cronometro");
}

export async function trocarSenha(_prev: FormState, formData: FormData): Promise<FormState> {
  const eu = await requireUsuario();
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  if (nova.length < SENHA_MINIMA) return { erro: `A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: eu.id } });
  if (!(await verificarSenha(atual, usuario.senhaHash))) return { erro: "Senha atual incorreta." };
  await prisma.usuario.update({ where: { id: eu.id }, data: { senhaHash: await hashSenha(nova) } });
  return { sucesso: true };
}
