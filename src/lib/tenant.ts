import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setCurrentBarbearia } from "@/lib/tenant-context";
import { requireSession } from "@/lib/session";
import { barbeariaEstaAtiva } from "@/lib/barbearia-status";

// Resolve a barbearia mais antiga cadastrada (a Bethânia). Usada só pelos
// redirects de compatibilidade das URLs antigas sem slug (/totem, /roleta/{id})
// e pela logo exibida em /login, que continua uma tela única e global.
export async function obterBarbeariaPadrao() {
  const barbearia = await prisma.barbearia.findFirst({ orderBy: { criadoEm: "asc" } });
  if (barbearia) setCurrentBarbearia(barbearia.id);
  return barbearia;
}

// Resolve a barbearia a partir do slug na URL (rotas públicas com [barbeariaSlug]).
// 404 se o slug não existir, estiver desativada ou tiver vencido.
export async function requireBarbeariaBySlug(slug: string) {
  const barbearia = await prisma.barbearia.findUnique({ where: { slug } });
  if (!barbearia || !(await barbeariaEstaAtiva(barbearia))) notFound();
  setCurrentBarbearia(barbearia.id);
  return barbearia;
}

// O "dono da plataforma" é o ADMIN da barbearia mais antiga cadastrada (a
// Bethânia, a primeira a existir no sistema) — só ele acessa o painel /dono,
// que lista e ativa/desativa as demais barbearias.
export async function ehDonoPlataforma(barbeariaId: string): Promise<boolean> {
  const barbeariaMaisAntiga = await prisma.barbearia.findFirst({ orderBy: { criadoEm: "asc" } });
  return barbeariaMaisAntiga?.id === barbeariaId;
}

export async function requireDonoPlataforma() {
  const session = await requireSession(["ADMIN"]);
  if (!(await ehDonoPlataforma(session.barbeariaId))) {
    redirect("/admin");
  }
  return session;
}
