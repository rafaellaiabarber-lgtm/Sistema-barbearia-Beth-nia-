import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DURATION_SECONDS, criarTokenSessao, verificarTokenSessao } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UsuarioLogado = { id: string; nome: string; papel: "INSTRUTOR" | "ALUNO" };

// Busca o usuário no banco a cada requisição (com cache dentro da mesma requisição),
// assim bloquear um aluno tira o acesso na hora, sem esperar o cookie expirar.
export const getUsuario = cache(async (): Promise<UsuarioLogado | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessao = await verificarTokenSessao(token);
  if (!sessao) return null;
  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: { id: true, nome: true, papel: true, ativo: true },
  });
  if (!usuario || !usuario.ativo) return null;
  return { id: usuario.id, nome: usuario.nome, papel: usuario.papel };
});

export async function requireUsuario(papel?: "INSTRUTOR") {
  const usuario = await getUsuario();
  if (!usuario) redirect("/entrar");
  if (papel && usuario.papel !== papel) redirect("/cronometro");
  return usuario;
}

export async function iniciarSessao(usuarioId: string) {
  (await cookies()).set(SESSION_COOKIE, await criarTokenSessao({ usuarioId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(SESSION_COOKIE);
}
