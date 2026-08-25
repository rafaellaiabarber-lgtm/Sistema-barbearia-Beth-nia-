import { prisma } from "@/lib/prisma";
import { TemasFeedback } from "./temas-feedback";
import { NovoFeedbackForm } from "./novo-feedback-form";
import { FeedbackRow } from "./feedback-row";

export const dynamic = "force-dynamic";

function corMedia(media: number) {
  if (media <= 4) return "text-red-600 dark:text-red-400";
  if (media <= 7) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ barbeiroId?: string }>;
}) {
  const { barbeiroId } = await searchParams;

  const [barbeiros, temas, feedbacks] = await Promise.all([
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.temaFeedback.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" } ] }),
    prisma.feedback.findMany({
      where: barbeiroId ? { barbeiroId } : {},
      include: { barbeiro: true },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const temasAtivos = temas.filter((t) => t.ativo);

  const mediaPorBarbeiro = new Map<string, { nome: string; soma: number; qtd: number }>();
  for (const f of feedbacks) {
    const atual = mediaPorBarbeiro.get(f.barbeiroId) ?? { nome: f.barbeiro.nome, soma: 0, qtd: 0 };
    atual.soma += f.nota;
    atual.qtd += 1;
    mediaPorBarbeiro.set(f.barbeiroId, atual);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Feedback da equipe</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Registre aqui as conversas de devolutiva com cada barbeiro — semanal, mensal ou avulsa — com nota de 0 a 10
        por tema e o que foi combinado.
      </p>

      <TemasFeedback temas={temas} />
      <NovoFeedbackForm barbeiros={barbeiros} temas={temasAtivos} />

      {mediaPorBarbeiro.size > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">Média por barbeiro</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[...mediaPorBarbeiro.values()].map((m) => (
              <div
                key={m.nome}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
              >
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{m.nome}</p>
                <p className={`text-2xl font-bold ${corMedia(m.soma / m.qtd)}`}>{(m.soma / m.qtd).toFixed(1)}</p>
                <p className="text-neutral-400 dark:text-neutral-500 text-xs">{m.qtd} feedback(s){barbeiroId ? "" : " no total"}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <form method="get" action="/admin/feedback" className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Filtrar por barbeiro</label>
          <select
            name="barbeiroId"
            defaultValue={barbeiroId ?? ""}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900 w-48"
          >
            <option value="">Todos</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300"
        >
          Filtrar
        </button>
      </form>

      <div className="space-y-2">
        {feedbacks.map((f) => (
          <FeedbackRow key={f.id} feedback={f} mostrarBarbeiro={!barbeiroId} />
        ))}
        {feedbacks.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum feedback registrado ainda.</p>}
      </div>
    </div>
  );
}
