import Link from "next/link";
import { obterConfiguracaoTotem } from "@/lib/actions/totem";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configuracao = await obterConfiguracaoTotem();
  const logoUrl = configuracao?.logoMenuUrl ?? configuracao?.logoUrl ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Barbearia Bethânia" className="h-16 mx-auto mb-4 object-contain" />
        ) : null}
        <h1 className="text-2xl font-bold text-slate-900 mb-1 text-center">Barbearia Bethânia</h1>
        <p className="text-slate-500 mb-6 text-center">Entrar como equipe</p>

        <LoginForm />

        <div className="mt-6 text-center">
          <Link href="/totem" className="text-sm text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">
            Sou cliente, quero entrar na fila →
          </Link>
        </div>
      </div>
    </div>
  );
}
