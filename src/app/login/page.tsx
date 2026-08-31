import Link from "next/link";
import { obterConfiguracaoTotem } from "@/lib/actions/totem";
import { obterBarbeariaPadrao } from "@/lib/tenant";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const barbearia = await obterBarbeariaPadrao();
  const configuracao = barbearia ? await obterConfiguracaoTotem(barbearia.id) : null;
  const logoUrl = configuracao?.logoMenuUrl ?? configuracao?.logoUrl ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Barbearia Bethânia" className="h-16 mx-auto mb-4 object-contain" />
        ) : null}
        <h1 className="text-2xl font-bold text-neutral-900 mb-1 text-center">Barbearia Bethânia</h1>
        <p className="text-neutral-500 mb-6 text-center">Entrar como equipe</p>

        <LoginForm />

        <div className="mt-6 text-center space-y-2">
          <Link href="/totem" className="block text-sm text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400">
            Sou cliente, quero entrar na fila →
          </Link>
          <Link href="/cadastro" className="block text-sm text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400">
            Ainda não tem conta? Cadastre sua barbearia →
          </Link>
        </div>
      </div>
    </div>
  );
}
