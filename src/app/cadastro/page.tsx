import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/session";
import { buscarConfiguracao } from "@/lib/cronometro-server";
import { TelaEntrada } from "@/components/ui";
import { CadastroForm } from "./cadastro-form";

export default async function CadastroPage() {
  if (await getUsuario()) redirect("/cronometro");
  const config = await buscarConfiguracao();

  return (
    <TelaEntrada titulo="Criar minha conta" subtitulo={config.nomeCurso}>
      {config.codigoConvite ? (
        <CadastroForm />
      ) : (
        <p className="text-center text-neutral-400 text-sm">
          O cadastro com código está fechado. Peça seu acesso ao instrutor do curso.
        </p>
      )}
      <p className="text-center text-sm text-neutral-400 mt-6">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-orange-400 font-semibold">
          Entrar
        </Link>
      </p>
    </TelaEntrada>
  );
}
