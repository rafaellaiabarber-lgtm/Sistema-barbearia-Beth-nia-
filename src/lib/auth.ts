import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "sessao";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 60; // 60 dias: o aluno não precisa ficar entrando de novo

let chaveEmCache: Uint8Array | null = null;

// Usa SESSION_SECRET se estiver configurado; senão, gera uma chave aleatória na primeira vez
// e guarda no banco — assim o app funciona sem precisar configurar nada na Vercel.
async function getSecretKey() {
  if (chaveEmCache) return chaveEmCache;
  let segredo = process.env.SESSION_SECRET;
  if (!segredo) {
    const novo = randomBytes(48).toString("base64url");
    try {
      await prisma.configuracao.upsert({ where: { id: "unica" }, create: { segredoSessao: novo }, update: {} });
    } catch {
      // Outra requisição criou a linha ao mesmo tempo; segue com o que estiver no banco.
    }
    // Se já existia um segredo (ou outra requisição criou ao mesmo tempo), vale o que está no banco.
    await prisma.configuracao.updateMany({ where: { id: "unica", segredoSessao: null }, data: { segredoSessao: novo } });
    const config = await prisma.configuracao.findUniqueOrThrow({ where: { id: "unica" } });
    segredo = config.segredoSessao!;
  }
  chaveEmCache = new TextEncoder().encode(segredo);
  return chaveEmCache;
}

export type SessionPayload = { usuarioId: string };

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function criarTokenSessao(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(await getSecretKey());
}

export async function verificarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, await getSecretKey());
    return typeof payload.usuarioId === "string" ? { usuarioId: payload.usuarioId } : null;
  } catch {
    return null;
  }
}

export function normalizarLogin(login: string) {
  return login.trim().toLowerCase().replace(/\s+/g, "");
}
