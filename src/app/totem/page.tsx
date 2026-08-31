import { redirect } from "next/navigation";
import { obterBarbeariaPadrao } from "@/lib/tenant";

// Compatibilidade com QR codes/links físicos antigos (sem slug). Redireciona
// pro link com o slug da barbearia padrão (a mais antiga cadastrada).
export const dynamic = "force-dynamic";

export default async function TotemRedirectPage() {
  const barbearia = await obterBarbeariaPadrao();
  if (barbearia) redirect(`/${barbearia.slug}/totem`);
  redirect("/login");
}
