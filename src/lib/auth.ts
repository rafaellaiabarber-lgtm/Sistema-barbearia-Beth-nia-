import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sessao";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 60; // 60 dias: o aluno não precisa ficar entrando de novo

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado no ambiente.");
  return new TextEncoder().encode(secret);
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
    .sign(getSecretKey());
}

export async function verificarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.usuarioId === "string" ? { usuarioId: payload.usuarioId } : null;
  } catch {
    return null;
  }
}

export function normalizarLogin(login: string) {
  return login.trim().toLowerCase().replace(/\s+/g, "");
}
