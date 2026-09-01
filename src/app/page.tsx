import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Monitor,
  Wallet,
  HandCoins,
  CreditCard,
  Disc3,
  Trophy,
  Target,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { obterConfiguracaoPlataforma } from "@/lib/actions/plataforma";

export const dynamic = "force-dynamic";

const RECURSOS = [
  {
    icone: Monitor,
    titulo: "Totem de autoatendimento",
    descricao: "O cliente chega, digita o telefone, escolhe o barbeiro e entra na fila sozinho. Sem recepcionista, sem post-it, sem bagunça.",
  },
  {
    icone: Wallet,
    titulo: "Financeiro completo",
    descricao: "Caixa, contas a pagar e receber, fluxo de caixa e DRE simplificada — tudo calculado automaticamente, sem planilha.",
  },
  {
    icone: HandCoins,
    titulo: "Comissão automática",
    descricao: "Por barbeiro, por serviço, já calculada na hora do atendimento — sem discussão no fim do mês.",
  },
  {
    icone: CreditCard,
    titulo: "Planos de assinatura",
    descricao: "Seus clientes assinam um plano mensal e o sistema já sabe quando é dia de corte incluso.",
  },
  {
    icone: Disc3,
    titulo: "Roleta de prêmios",
    descricao: "O cliente gira e ganha um desconto — um jeito divertido de trazer ele de volta pra próxima visita.",
  },
  {
    icone: Trophy,
    titulo: "Ranking da equipe",
    descricao: "Pontuação e prêmio pros barbeiros que mais atendem e vendem — motivação sem esforço nenhum seu.",
  },
  {
    icone: Target,
    titulo: "Metas e campanhas",
    descricao: "Defina metas de faturamento, atendimentos ou vendas por barbeiro, e crie campanhas de venda com checklist.",
  },
  {
    icone: ShieldCheck,
    titulo: "Seus dados, só seus",
    descricao: "Cada barbearia tem o próprio espaço, completamente isolado das outras. Ninguém vê os dados de ninguém.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "BARBEIRO") redirect("/fila");

  const configuracao = await obterConfiguracaoPlataforma();
  const fotosGaleria = [
    configuracao?.fotoGaleria1Url,
    configuracao?.fotoGaleria2Url,
    configuracao?.fotoGaleria3Url,
  ].filter((url): url is string => Boolean(url));

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">Sistema Barbearia</span>
          <Link href="/login" className="text-sm text-neutral-500 hover:text-orange-600">
            Já tenho conta — Entrar
          </Link>
        </div>
      </header>

      <section
        className="bg-neutral-950 text-white bg-cover bg-center"
        style={configuracao?.fotoHeroUrl ? { backgroundImage: `linear-gradient(rgba(10,10,10,0.75), rgba(10,10,10,0.85)), url(${configuracao.fotoHeroUrl})` } : undefined}
      >
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-black mb-5 leading-tight">
            O sistema completo pra sua barbearia crescer
          </h1>
          <p className="text-neutral-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Fila automática pelo totem, financeiro completo, comissão calculada sozinha, plano de assinatura,
            roleta de prêmios e muito mais — tudo em um só lugar.
          </p>
          <Link
            href="/assinar"
            className="inline-block rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 transition-colors"
          >
            Quero assinar
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Tudo que sua barbearia precisa</h2>
        <p className="text-neutral-500 text-center mb-12">Um sistema só, sem precisar juntar várias ferramentas soltas.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="border border-neutral-200 rounded-2xl p-5">
              <r.icone className="w-8 h-8 text-orange-600 mb-3" />
              <h3 className="font-bold mb-1">{r.titulo}</h3>
              <p className="text-neutral-500 text-sm">{r.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {fotosGaleria.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {fotosGaleria.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="w-full h-56 object-cover rounded-2xl" />
            ))}
          </div>
        </section>
      )}

      <section className="bg-neutral-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Comece agora, em poucos minutos</h2>
          <p className="text-neutral-500 mb-8">
            Crie sua conta, cadastre seus barbeiros e serviços, e já comece a usar o totem e a gestão completa.
          </p>
          <Link
            href="/assinar"
            className="inline-block rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 transition-colors"
          >
            Quero assinar
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-neutral-400">
          <Link href="/login" className="hover:text-orange-600">Já tenho conta — Entrar</Link>
          <Link href="/termos" className="hover:text-orange-600">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-orange-600">Política de Privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
