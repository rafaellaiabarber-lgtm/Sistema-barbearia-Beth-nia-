import Link from "next/link";
import { CadastroForm } from "./cadastro-form";

export const dynamic = "force-dynamic";

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1 text-center">Crie sua conta</h1>
        <p className="text-neutral-500 mb-6 text-center">Cadastre sua barbearia no sistema</p>

        <CadastroForm />

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-neutral-500 hover:text-orange-600">
            Já tem uma conta? Entrar →
          </Link>
        </div>
      </div>
    </div>
  );
}
