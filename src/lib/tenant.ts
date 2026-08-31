import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setCurrentBarbearia } from "@/lib/tenant-context";

// Resolve a barbearia mais antiga cadastrada (a Bethânia). Usada só pelos
// redirects de compatibilidade das URLs antigas sem slug (/totem, /roleta/{id})
// e pela logo exibida em /login, que continua uma tela única e global.
export async function obterBarbeariaPadrao() {
  const barbearia = await prisma.barbearia.findFirst({ orderBy: { criadoEm: "asc" } });
  if (barbearia) setCurrentBarbearia(barbearia.id);
  return barbearia;
}

// Resolve a barbearia a partir do slug na URL (rotas públicas com [barbeariaSlug]).
// 404 se o slug não existir ou a barbearia estiver desativada.
export async function requireBarbeariaBySlug(slug: string) {
  const barbearia = await prisma.barbearia.findUnique({ where: { slug } });
  if (!barbearia || !barbearia.ativa) notFound();
  setCurrentBarbearia(barbearia.id);
  return barbearia;
}
