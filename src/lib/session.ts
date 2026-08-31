import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verificarTokenSessao, type SessionPayload } from "@/lib/auth";
import { setCurrentBarbearia } from "@/lib/tenant-context";
import { prisma } from "@/lib/prisma";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarTokenSessao(token);
}

export async function requireSession(rolesPermitidas?: Array<"ADMIN" | "BARBEIRO">) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (rolesPermitidas && !rolesPermitidas.includes(session.role)) {
    redirect("/login");
  }
  const barbearia = await prisma.barbearia.findUnique({
    where: { id: session.barbeariaId },
    select: { ativa: true },
  });
  if (!barbearia || !barbearia.ativa) {
    redirect("/login");
  }
  setCurrentBarbearia(session.barbeariaId);
  return session;
}
