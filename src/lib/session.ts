import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verificarTokenSessao, type SessionPayload } from "@/lib/auth";

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
  return session;
}
