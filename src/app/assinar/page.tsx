import Link from "next/link";
import { listarPlanosPlataformaAtivos } from "@/lib/actions/planos-plataforma";
import { formatarReais } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AssinarPage() {
  const planos = await listarPlanosPlataformaAtivos();

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            Sistema Barbearia
          </Link>
          <Link href="/login" className="text-sm text-neutral-500 hover:text-orange-600">
            Já tenho conta — Entrar
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-black mb-3">Escolha o seu plano</h1>
        <p className="text-neutral-500 text-lg mb-12">
          Assine, e depois de confirmado o pagamento você é direcionado pra criar a conta da sua barbearia.
        </p>

        {planos.length === 0 && (
          <p className="text-neutral-400">Nenhum plano disponível no momento. Fale com a gente pra saber mais.</p>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {planos.map((p) => (
            <div key={p.id} className="border border-neutral-200 rounded-2xl p-6 text-left flex flex-col">
              <h2 className="font-bold text-xl mb-1">{p.nome}</h2>
              {p.descricao && <p className="text-neutral-500 text-sm mb-4">{p.descricao}</p>}
              <p className="text-3xl font-black mb-1">
                {formatarReais(p.precoCentavos)}
                <span className="text-base font-normal text-neutral-500"> / {p.periodo}</span>
              </p>
              <a
                href={p.linkPagamento}
                className="mt-6 inline-block text-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-6 py-3 transition-colors"
              >
                Assinar
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-neutral-400">
          <Link href="/termos" className="hover:text-orange-600">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-orange-600">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
