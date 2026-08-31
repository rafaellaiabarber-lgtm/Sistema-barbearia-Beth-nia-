import Link from "next/link";
import { listarPlanosPlataforma } from "@/lib/actions/planos-plataforma";
import { NovoPlanoForm } from "./novo-plano-form";
import { PlanoRow } from "./plano-row";

export const dynamic = "force-dynamic";

export default async function PlanosPlataformaPage() {
  const planos = await listarPlanosPlataforma();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/dono" className="text-sm text-neutral-500 hover:text-orange-600 mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Planos de assinatura</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          Os planos que você cobra de cada barbearia pra usar o sistema. Aparecem em <code>/assinar</code>, a página
          que a pessoa vê ao clicar em &quot;Quero assinar&quot; na página de vendas. O link de pagamento é o link
          pronto gerado no Mercado Pago, PagSeguro, Asaas ou parecido — depois de pagar, configure lá pra redirecionar
          a pessoa pra <code>/cadastro</code>.
        </p>

        <NovoPlanoForm />

        <div className="space-y-3">
          {planos.map((p) => (
            <PlanoRow key={p.id} plano={p} />
          ))}
          {planos.length === 0 && (
            <p className="text-neutral-400 dark:text-neutral-500">Nenhum plano cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
