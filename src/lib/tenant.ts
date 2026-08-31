import { prisma } from "@/lib/prisma";
import { setCurrentBarbearia } from "@/lib/tenant-context";

// Enquanto as rotas públicas (totem, roleta, login) ainda não têm o slug da
// barbearia na URL, elas resolvem pra essa única barbearia "padrão" — a mais
// antiga cadastrada. Só existe uma barbearia até o cadastro público (etapa 7
// da conversão multi-tenant) entrar no ar, então isso é seguro por enquanto.
// Substituído pela resolução via slug quando as rotas públicas ganharem
// [barbeariaSlug] na URL.
export async function obterBarbeariaPadrao() {
  const barbearia = await prisma.barbearia.findFirst({ orderBy: { criadoEm: "asc" } });
  if (barbearia) setCurrentBarbearia(barbearia.id);
  return barbearia;
}
