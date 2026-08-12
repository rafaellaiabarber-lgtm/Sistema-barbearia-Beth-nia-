import { prisma } from "@/lib/prisma";
import { formatarReais, LABEL_FORMA_PAGAMENTO, LABEL_CATEGORIA_DESPESA } from "@/lib/format";
import { excluirMovimentoCaixa } from "@/lib/actions/caixa";
import { NovoMovimentoForm } from "./novo-movimento-form";
import { NovoAtendimentoForm } from "./novo-atendimento-form";
import { NovaVendaProdutoForm } from "./nova-venda-produto-form";
import { BotaoExcluirAtendimento } from "../excluir-atendimento-button";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type Lancamento = {
  id: string;
  tipo: "atendimento" | "movimento";
  horario: Date;
  descricao: string;
  valorCentavos: number;
  formaPagamento: string | null;
  categoria: string | null;
};

export default async function CaixaPage() {
  const inicio = inicioDoDia();

  const [atendimentosHoje, movimentosHoje, barbeiros, servicos, produtos] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio } },
      include: { cliente: true, barbeiro: true },
      orderBy: { concluidoEm: "asc" },
    }),
    prisma.movimentoCaixa.findMany({
      where: { criadoEm: { gte: inicio } },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.servico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const lancamentos: Lancamento[] = [
    ...atendimentosHoje.map((a) => ({
      id: a.id,
      tipo: "atendimento" as const,
      horario: a.concluidoEm!,
      descricao: `Atendimento — ${a.cliente.nome}${a.barbeiro ? ` (${a.barbeiro.nome})` : ""}`,
      valorCentavos: a.precoTotalCentavos,
      formaPagamento: a.formaPagamento,
      categoria: null,
    })),
    ...movimentosHoje.map((m) => ({
      id: m.id,
      tipo: "movimento" as const,
      horario: m.criadoEm,
      descricao: m.descricao,
      valorCentavos: m.tipo === "ENTRADA" ? m.valorCentavos : -m.valorCentavos,
      formaPagamento: m.formaPagamento,
      categoria: m.categoria,
    })),
  ].sort((a, b) => a.horario.getTime() - b.horario.getTime());

  let saldo = 0;
  const linhas = lancamentos.map((l) => {
    saldo += l.valorCentavos;
    return { ...l, saldo };
  });

  const totalDoDia = saldo;

  const porFormaPagamento = new Map<string, number>();
  for (const l of linhas) {
    if (l.valorCentavos <= 0 || !l.formaPagamento) continue;
    porFormaPagamento.set(l.formaPagamento, (porFormaPagamento.get(l.formaPagamento) ?? 0) + l.valorCentavos);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Caixa do dia</h1>

      <NovoAtendimentoForm barbeiros={barbeiros} servicos={servicos} />
      <NovaVendaProdutoForm barbeiros={barbeiros} produtos={produtos} />
      <NovoMovimentoForm />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total no caixa hoje</p>
          <p className={`text-3xl font-bold ${totalDoDia < 0 ? "text-red-600" : "text-blue-600"}`}>
            {formatarReais(totalDoDia)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Entradas por forma de pagamento</p>
          {porFormaPagamento.size === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhuma entrada com forma de pagamento hoje.</p>
          ) : (
            <div className="space-y-1">
              {[...porFormaPagamento.entries()].map(([forma, valor]) => (
                <div key={forma} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{LABEL_FORMA_PAGAMENTO[forma] ?? forma}</span>
                  <span className="font-semibold text-blue-600">{formatarReais(valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">Nenhum lançamento hoje ainda.</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <div
              key={`${l.tipo}-${l.id}`}
              className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{l.descricao}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">
                  {l.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · saldo:{" "}
                  {formatarReais(l.saldo)}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {l.formaPagamento && (
                    <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5">
                      {LABEL_FORMA_PAGAMENTO[l.formaPagamento] ?? l.formaPagamento}
                    </span>
                  )}
                  {l.categoria && (
                    <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 text-xs px-2 py-0.5">
                      {LABEL_CATEGORIA_DESPESA[l.categoria] ?? l.categoria}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${l.valorCentavos < 0 ? "text-red-600" : "text-green-600"}`}>
                  {l.valorCentavos < 0 ? "-" : "+"}
                  {formatarReais(Math.abs(l.valorCentavos))}
                </span>
                {l.tipo === "atendimento" ? (
                  <BotaoExcluirAtendimento atendimentoId={l.id} />
                ) : (
                  <form action={excluirMovimentoCaixa.bind(null, l.id)}>
                    <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm">Excluir</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
