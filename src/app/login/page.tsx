import Link from "next/link";
import { LoginForm } from "./login-form";

// Página de login compartilhada por TODAS as barbearias cadastradas (o usuário
// digita o login e o sistema descobre a qual barbearia ele pertence) — por isso não
// mostra nome/logo de nenhuma barbearia específica.
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1 text-center">Entrar</h1>
        <p className="text-neutral-500 mb-6 text-center">Acesse sua conta da equipe</p>

        <LoginForm />

        <div className="mt-6 text-center space-y-2">
          <Link href="/cadastro" className="block text-sm text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400">
            Ainda não tem conta? Cadastre sua barbearia →
          </Link>
        </div>
      </div>
    </div>
  );
}
