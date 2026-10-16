import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuario } from "@/lib/session";
import { buscarConfiguracao } from "@/lib/cronometro-server";
import { TelaEntrada } from "@/components/ui";
import { EntrarForm } from "./entrar-form";

export default async function EntrarPage() {
  if (await getUsuario()) redirect("/cronometro");
  if ((await prisma.usuario.count()) === 0) redirect("/primeiro-acesso");
  const config = await buscarConfiguracao();

  return (
    <TelaEntrada titulo={config.nomeCurso} subtitulo="Entre com o login que o instrutor te passou.">
      <EntrarForm />
      {config.codigoConvite && (
        <p className="text-center text-sm text-neutral-400 mt-6">
          Recebeu um código do curso?{" "}
          <Link href="/cadastro" className="text-orange-400 font-semibold">
            Criar minha conta
          </Link>
        </p>
      )}
    </TelaEntrada>
  );
}
