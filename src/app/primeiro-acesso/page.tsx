import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TelaEntrada } from "@/components/ui";
import { PrimeiroAcessoForm } from "./primeiro-acesso-form";

export default async function PrimeiroAcessoPage() {
  // Só existe enquanto o app não tem nenhum usuário: quem chega primeiro vira o instrutor.
  if ((await prisma.usuario.count()) > 0) redirect("/entrar");
  return (
    <TelaEntrada titulo="Configurar o app" subtitulo="Crie a conta de instrutor. Só você terá esse acesso.">
      <PrimeiroAcessoForm />
    </TelaEntrada>
  );
}
