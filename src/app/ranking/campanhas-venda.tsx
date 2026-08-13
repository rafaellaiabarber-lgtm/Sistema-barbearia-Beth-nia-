import { itemCompleto, campanhaCompleta, type ItemProgresso } from "@/lib/campanhas";

export function CampanhasVenda({
  campanhas,
}: {
  campanhas: { id: string; titulo: string | null; barbeiroNome: string; itens: ItemProgresso[] }[];
}) {
  if (campanhas.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-1">O que cada barbeiro pode vender</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
        Sugestões de produtos e serviços pra oferecer ao cliente, com o progresso de cada campanha ativa.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campanhas.map((c) => {
          const completa = campanhaCompleta(c.itens);
          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
            >
              <p className="font-semibold mb-3">
                {c.barbeiroNome}
                {c.titulo ? ` — ${c.titulo}` : ""}
                {completa && <span className="ml-2 text-green-600 text-sm font-medium">🎉 Completa!</span>}
              </p>
              <div className="space-y-3">
                {c.itens.map((item) => {
                  const feito = itemCompleto(item);
                  const percentual = Math.min((item.quantidadeAtual / item.quantidadeAlvo) * 100, 100);
                  return (
                    <div key={item.itemId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={feito ? "text-green-700 dark:text-green-400" : "text-slate-700 dark:text-slate-200"}>
                          {feito ? "✓ " : ""}
                          {item.nome}
                        </span>
                        <span className="font-semibold text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          {item.quantidadeAtual}/{item.quantidadeAlvo}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${feito ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
