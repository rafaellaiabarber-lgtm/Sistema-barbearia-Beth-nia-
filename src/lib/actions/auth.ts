"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarTokenSessao, verificarSenha, SESSION_COOKIE, SESSION_DURATION_SECONDS } from "@/lib/auth";
import { barbeariaEstaAtiva } from "@/lib/barbearia-status";

export type LoginState = { erro?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!login || !senha) {
    return { erro: "Preencha usuário e senha." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { login }, include: { barbearia: true } });
  if (!usuario) {
    return { erro: "Usuário ou senha inválidos." };
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaValida) {
    return { erro: "Usuário ou senha inválidos." };
  }

  if (!usuario.barbearia) {
    return { erro: "Conta sem barbearia vinculada. Fale com o suporte." };
  }
  if (!(await barbeariaEstaAtiva(usuario.barbearia))) {
    return { erro: "Essa conta está desativada. Fale com o suporte." };
  }

  const token = await criarTokenSessao({
    usuarioId: usuario.id,
    nome: usuario.nome,
    role: usuario.role,
    barbeiroId: usuario.barbeiroId,
    barbeariaId: usuario.barbearia.id,
    barbeariaSlug: usuario.barbearia.slug,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  redirect(usuario.role === "ADMIN" ? "/admin" : "/fila");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
