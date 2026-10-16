import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { TelaEntrada } from "@/components/ui";
import { PrimeiroAcessoForm } from "./primeiro-acesso-form";

export default async function PrimeiroAcessoPage() {
  // Só existe enquanto o app não tem nenhum usuário: quem chega primeiro vira o instrutor.
  // connection() garante que essa checagem roda a cada visita, e não uma vez só no build.
  await connection();
  if ((await prisma.usuario.count()) > 0) redirect("/entrar");
  return (
    <TelaEntrada titulo="Configurar o app" subtitulo="Crie a conta de instrutor. Só você terá esse acesso.">
      <PrimeiroAcessoForm />
    </TelaEntrada>
  );
}
