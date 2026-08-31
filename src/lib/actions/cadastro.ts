"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/auth";
import { proximaDataDeVencimento } from "@/lib/barbearia-status";

// Rotas reais do Next.js que um slug de barbearia não pode ocupar.
const SLUGS_RESERVADOS = new Set([
  "admin",
  "login",
  "cadastro",
  "api",
  "totem",
  "roleta",
  "fila",
  "despesas",
  "indicacoes",
  "planos",
  "ranking",
  "treinamento",
  "www",
  "app",
  "static",
  "public",
  "assets",
  "favicon.ico",
  "_next",
]);

export type CadastroState = { erro?: string };

export async function cadastrarBarbearia(_prevState: CadastroState, formData: FormData): Promise<CadastroState> {
  const nomeBarbearia = String(formData.get("nomeBarbearia") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const nomeResponsavel = String(formData.get("nomeResponsavel") ?? "").trim();
  const login = String(formData.get("login") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!nomeBarbearia || nomeBarbearia.length < 2) {
    return { erro: "Informe o nome da barbearia." };
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    return { erro: "O link deve ter entre 3 e 40 letras minúsculas, números e hífen (ex: barbearia-do-joao)." };
  }
  if (SLUGS_RESERVADOS.has(slug)) {
    return { erro: "Esse link é reservado pelo sistema. Escolha outro." };
  }
  if (!nomeResponsavel) {
    return { erro: "Informe seu nome." };
  }
  if (!login || login.length < 3) {
    return { erro: "Escolha um usuário com pelo menos 3 caracteres." };
  }
  if (!senha || senha.length < 6) {
    return { erro: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmarSenha) {
    return { erro: "As senhas não coincidem." };
  }

  const [slugExistente, loginExistente] = await Promise.all([
    prisma.barbearia.findUnique({ where: { slug } }),
    prisma.usuario.findUnique({ where: { login } }),
  ]);
  if (slugExistente) return { erro: "Esse link já está em uso. Escolha outro." };
  if (loginExistente) return { erro: "Esse usuário já existe. Escolha outro." };

  const senhaHash = await hashSenha(senha);

  await prisma.$transaction(async (tx) => {
    const barbearia = await tx.barbearia.create({
      data: { slug, nome: nomeBarbearia, validaAte: proximaDataDeVencimento() },
    });
    await tx.usuario.create({
      data: { barbeariaId: barbearia.id, nome: nomeResponsavel, login, senhaHash, role: "ADMIN" },
    });
  });

  redirect("/login");
}
