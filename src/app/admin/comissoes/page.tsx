import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo, chavePeriodo, validarPeriodo } from "@/lib/periodo";
import { marcarComissaoPaga, desmarcarComissaoPaga } from "@/lib/actions/comissoes";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { FiltroRelatorio, normalizarServicoIds } from "../filtro-relatorio";
import { Scissors, Package, Sparkles } from "lucide-react";
import { CorrigirComissaoCobertaButton } from "./corrigir-comissao-coberta-button";
import { CalculadoraComissaoCombinada } from "./calculadora-comissao-combinada";
import { ExportarRelatorioBarbeirosButton } from "./exportar-relatorio-barbeiros-button";
import { ExportarRelatorioMotoresButton } from "./exportar-relatorio-motores-button";
import { Valor } from "../../valor";

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
    servicoId?: string | string[];
    barbeiroId?: string;
  }>;
}) {
  const session = await requireSession(["ADMIN"]);
  const { periodo: periodoParam, dataInicio, dataFim, servicoId, barbeiroId } = await searchParams;
  const servicoIds = normalizarServicoIds(servicoId);
  const periodo: Periodo = validarPeriodo(periodoParam, "hoje");
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio, dataFim });
  const podeMarcarPago = periodo !== "personalizado" && periodo !== "dia";
  const chave = podeMarcarPago ? chavePeriodo(periodo) : "";

  const [atendimentos, servicos, barbeiros, vendasProduto, produtosAtivos, minhaBarbearia] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        barbeariaId: session.barbeariaId,
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
        ...(servicoIds.length > 0 ? { servicos: { some: { servicoId: { in: servicoIds } } } } : {}),
      },
      include: { barbeiro: true, servicos: true, cliente: true },
      orderBy: { concluidoEm: "desc" },
    }),
    prisma.servico.findMany({ where: { barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ where: { barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
    prisma.vendaProduto.findMany({
      where: { barbeariaId: session.barbeariaId, criadoEm: { gte: inicio, lte: fim }, ...(barbeiroId ? { barbeiroId } : {}) },
      include: { produto: true },
    }),
    prisma.produto.findMany({ where: { ativo: true, barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
    prisma.barbearia.findUnique({ where: { id: session.barbeariaId }, select: { nome: true } }),
  ]);

  const barbeirosPorId = new Map(barbeiros.map((b) => [b.id, b]));
  const categoriaPorServicoId = new Map(servicos.map((s) => [s.id, s.categoria]));

  const porBarbeiro = new Map<
    string,
    {
      nome: string;
      totalCentavos: number;
      comissaoCentavos: number;
      qtd: number;
      atendimentos: { clienteNome: string; servicos: string[]; valorCentavos: number; comissaoCentavos: number }[];
      motorPrincipalCentavos: number;
      motorExtraCentavos: number;
      motorProdutosCentavos: number;
      qtdExtras: number;
      extrasPorNome: Map<string, number>;
      qtdProdutos: number;
      produtosPorNome: Map<string, number>;
    }
  >();
  for (const a of atendimentos) {
    if (!a.barbeiro) continue;
    const atual = porBarbeiro.get(a.barbeiro.id) ?? {
      nome: a.barbeiro.nome,
      totalCentavos: 0,
      comissaoCentavos: 0,
      qtd: 0,
      atendimentos: [],
      motorPrincipalCentavos: 0,
      motorExtraCentavos: 0,
      motorProdutosCentavos: 0,
      qtdExtras: 0,
      extrasPorNome: new Map<string, number>(),
      qtdProdutos: 0,
      produtosPorNome: new Map<string, number>(),
    };
    atual.totalCentavos += a.precoTotalCentavos;
    // Contagem de atendimento/serviço extra conta mesmo quando coberto por assinatura — é
    // desempenho operacional (o barbeiro atendeu e ofereceu o extra), não cálculo de comissão.
    for (const item of a.servicos) {
      if (categoriaPorServicoId.get(item.servicoId) === "EXTRA") {
        atual.qtdExtras += 1;
        atual.extrasPorNome.set(item.nomeSnapshot, (atual.extrasPorNome.get(item.nomeSnapshot) ?? 0) + 1);
      }
    }
    // Coberto por assinatura: não entra na comissão — o gestor não quer contar o rateio
    // do clube junto com a comissão de serviço/produto.
    const comissaoAtendimento = a.cobertoPorAssinatura ? 0 : comissaoServicos(a.servicos, a.barbeiro.comissaoPercentual);
    if (!a.cobertoPorAssinatura) {
      atual.comissaoCentavos += comissaoAtendimento;
      for (const item of a.servicos) {
        const comissaoItem = comissaoServicos([item], a.barbeiro.comissaoPercentual);
        if (categoriaPorServicoId.get(item.servicoId) === "EXTRA") atual.motorExtraCentavos += comissaoItem;
        else atual.motorPrincipalCentavos += comissaoItem;
      }
    }
    atual.qtd += 1;
    atual.atendimentos.push({
      clienteNome: a.cliente.nome,
      servicos: a.servicos.map((s) => s.nomeSnapshot),
      valorCentavos: a.precoTotalCentavos,
      comissaoCentavos: comissaoAtendimento,
    });
    porBarbeiro.set(a.barbeiro.id, atual);
  }
  const vendasPorBarbeiro = new Map<string, typeof vendasProduto>();
  for (const v of vendasProduto) {
    if (!v.barbeiroId) continue;
    vendasPorBarbeiro.set(v.barbeiroId, [...(vendasPorBarbeiro.get(v.barbeiroId) ?? []), v]);
  }
  for (const [barbeiroId, vendas] of vendasPorBarbeiro) {
    const barbeiro = barbeirosPorId.get(barbeiroId);
    if (!barbeiro) continue;
    const atual = porBarbeiro.get(barbeiroId) ?? {
      nome: barbeiro.nome,
      totalCentavos: 0,
      comissaoCentavos: 0,
      qtd: 0,
      atendimentos: [],
      motorPrincipalCentavos: 0,
      motorExtraCentavos: 0,
      motorProdutosCentavos: 0,
      qtdExtras: 0,
      extrasPorNome: new Map<string, number>(),
      qtdProdutos: 0,
      produtosPorNome: new Map<string, number>(),
    };
    const comissaoProdutosBarbeiro = comissaoProdutos(vendas);
    atual.comissaoCentavos += comissaoProdutosBarbeiro;
    atual.motorProdutosCentavos += comissaoProdutosBarbeiro;
    for (const v of vendas) {
      atual.qtdProdutos += v.quantidade;
      atual.produtosPorNome.set(v.produto.nome, (atual.produtosPorNome.get(v.produto.nome) ?? 0) + v.quantidade);
    }
    porBarbeiro.set(barbeiroId, atual);
  }

  const categoriaFaturamento = { PRINCIPAL: 0, EXTRA: 0 } as Record<"PRINCIPAL" | "EXTRA", number>;
  for (const a of atendimentos) {
    for (const s of a.servicos) {
      const categoria = categoriaPorServicoId.get(s.servicoId) ?? "PRINCIPAL";
      categoriaFaturamento[categoria] += s.precoCentavos;
    }
  }
  const motorProdutosFaturamentoCentavos = vendasProduto.reduce((soma, v) => soma + v.totalCentavos, 0);
  const motores = [
    {
      nome: "Corte & Barba",
      faturamentoCentavos: categoriaFaturamento.PRINCIPAL,
      comissaoCentavos: [...porBarbeiro.values()].reduce((s, b) => s + b.motorPrincipalCentavos, 0),
    },
    {
      nome: "Produtos",
      faturamentoCentavos: motorProdutosFaturamentoCentavos,
      comissaoCentavos: [...porBarbeiro.values()].reduce((s, b) => s + b.motorProdutosCentavos, 0),
    },
    {
      nome: "Serviços extras",
      faturamentoCentavos: categoriaFaturamento.EXTRA,
      comissaoCentavos: [...porBarbeiro.values()].reduce((s, b) => s + b.motorExtraCentavos, 0),
    },
  ];

  const pagamentos = podeMarcarPago
    ? await prisma.pagamentoComissao.findMany({
        where: {
          barbeariaId: session.barbeariaId,
          periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES",
          chave,
          barbeiroId: { in: [...porBarbeiro.keys()] },
        },
      })
    : [];
  const pagosPorBarbeiro = new Map(pagamentos.map((p) => [p.barbeiroId, p]));

  const rankingServicos = new Map<string, { nome: string; qtd: number; totalCentavos: number; comissaoCentavos: number }>();
  for (const a of atendimentos) {
    for (const s of a.servicos) {
      const atual = rankingServicos.get(s.nomeSnapshot) ?? {
        nome: s.nomeSnapshot,
        qtd: 0,
        totalCentavos: 0,
        comissaoCentavos: 0,
      };
      atual.qtd += 1;
      atual.totalCentavos += s.precoCentavos;
      if (a.barbeiro && !a.cobertoPorAssinatura) {
        atual.comissaoCentavos += comissaoServicos([s], a.barbeiro.comissaoPercentual);
      }
      rankingServicos.set(s.nomeSnapshot, atual);
    }
  }
  const ranking = [...rankingServicos.values()].sort((a, b) => b.qtd - a.qtd);

  const qtdServicoPorId = new Map<string, number>();
  for (const a of atendimentos) {
    for (const s of a.servicos) {
      qtdServicoPorId.set(s.servicoId, (qtdServicoPorId.get(s.servicoId) ?? 0) + 1);
    }
  }
  const servicosSemVenda = servicos.filter((s) => s.ativo && !qtdServicoPorId.has(s.id));

  const qtdProdutoPorId = new Map<string, number>();
  for (const v of vendasProduto) {
    qtdProdutoPorId.set(v.produtoId, (qtdProdutoPorId.get(v.produtoId) ?? 0) + v.quantidade);
  }
  const produtosSemVenda = produtosAtivos.filter((p) => !qtdProdutoPorId.has(p.id));

  const servicoIdUnico = servicoIds.length === 1 ? servicoIds[0] : null;
  const barbeiroSelecionado = barbeiroId ? barbeirosPorId.get(barbeiroId) : null;
  const servicoSelecionado = servicoIdUnico ? servicos.find((s) => s.id === servicoIdUnico) : null;
  const itensDoServico = servicoIdUnico
    ? atendimentos.flatMap((a) => a.servicos.filter((s) => s.servicoId === servicoIdUnico))
    : [];
  const periodoLabel = `${inicio.toLocaleDateString("pt-BR")} até ${fim.toLocaleDateString("pt-BR")}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Comissões</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportarRelatorioBarbeirosButton
            barbeariaNome={minhaBarbearia?.nome ?? "Barbearia"}
            periodoLabel={periodoLabel}
            barbeiros={[...porBarbeiro.values()].map((b) => ({
              nome: b.nome,
              qtd: b.qtd,
              totalCentavos: b.totalCentavos,
              comissaoCentavos: b.comissaoCentavos,
            }))}
          />
          <ExportarRelatorioMotoresButton
            barbeariaNome={minhaBarbearia?.nome ?? "Barbearia"}
            periodoLabel={periodoLabel}
            barbeiros={[...porBarbeiro.values()].map((b) => ({
              nome: b.nome,
              clientesAtendidos: b.qtd,
              qtdExtras: b.qtdExtras,
              extras: [...b.extrasPorNome.entries()]
                .map(([nome, qtd]) => ({ nome, qtd }))
                .sort((x, y) => y.qtd - x.qtd),
              qtdProdutos: b.qtdProdutos,
              produtos: [...b.produtosPorNome.entries()]
                .map(([nome, qtd]) => ({ nome, qtd }))
                .sort((x, y) => y.qtd - x.qtd),
            }))}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Os 3 motores no período</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 shadow-sm bg-orange-600 text-white flex items-start justify-between">
          <div>
            <p className="text-orange-100 text-sm mb-2">Corte &amp; Barba</p>
            <p className="text-orange-100 text-xs">Bruto</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[0].faturamentoCentavos)}</Valor></p>
            <p className="text-orange-100 text-xs mt-1">Comissão dos barbeiros</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[0].comissaoCentavos)}</Valor></p>
            <p className="text-orange-100 text-xs mt-1">Margem líquida de lucro</p>
            <p className="text-xl font-bold">
              <Valor>{formatarReais(motores[0].faturamentoCentavos - motores[0].comissaoCentavos)}</Valor>
            </p>
          </div>
          <Scissors className="w-7 h-7 text-orange-200 shrink-0" />
        </div>
        <div className="rounded-xl p-5 shadow-sm bg-amber-500 text-white flex items-start justify-between">
          <div>
            <p className="text-amber-100 text-sm mb-2">Produtos</p>
            <p className="text-amber-100 text-xs">Bruto</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[1].faturamentoCentavos)}</Valor></p>
            <p className="text-amber-100 text-xs mt-1">Comissão dos barbeiros</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[1].comissaoCentavos)}</Valor></p>
            <p className="text-amber-100 text-xs mt-1">Margem líquida de lucro</p>
            <p className="text-xl font-bold">
              <Valor>{formatarReais(motores[1].faturamentoCentavos - motores[1].comissaoCentavos)}</Valor>
            </p>
          </div>
          <Package className="w-7 h-7 text-amber-200 shrink-0" />
        </div>
        <div className="rounded-xl p-5 shadow-sm bg-rose-500 text-white flex items-start justify-between">
          <div>
            <p className="text-rose-100 text-sm mb-2">Serviços extras</p>
            <p className="text-rose-100 text-xs">Bruto</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[2].faturamentoCentavos)}</Valor></p>
            <p className="text-rose-100 text-xs mt-1">Comissão dos barbeiros</p>
            <p className="text-xl font-bold"><Valor>{formatarReais(motores[2].comissaoCentavos)}</Valor></p>
            <p className="text-rose-100 text-xs mt-1">Margem líquida de lucro</p>
            <p className="text-xl font-bold">
              <Valor>{formatarReais(motores[2].faturamentoCentavos - motores[2].comissaoCentavos)}</Valor>
            </p>
          </div>
          <Sparkles className="w-7 h-7 text-rose-200 shrink-0" />
        </div>
      </div>

      <CorrigirComissaoCobertaButton />

      <FiltroRelatorio
        basePath="/admin/comissoes"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        servicoIds={servicoIds}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros}
      />

      {barbeiroSelecionado && servicoSelecionado && itensDoServico.length > 0 && (
        <CalculadoraComissaoCombinada
          barbeiroNome={barbeiroSelecionado.nome}
          servicoNome={servicoSelecionado.nome}
          periodoLabel={periodoLabel}
          quantidade={itensDoServico.length}
          comissaoAtualCentavos={comissaoServicos(itensDoServico, barbeiroSelecionado.comissaoPercentual)}
        />
      )}

      {!podeMarcarPago && (
        <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
          Período personalizado: marcar comissão como paga fica disponível só em Hoje/Semana/Mês.
        </p>
      )}

      <div className="space-y-2 mb-8">
        {[...porBarbeiro.entries()].map(([id, b]) => {
          const pago = pagosPorBarbeiro.get(id);
          return (
            <div
              key={id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold">{b.nome}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {b.qtd} atendimento(s) · faturamento total <Valor>{formatarReais(b.totalCentavos)}</Valor>
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-neutral-400 dark:text-neutral-500 text-xs">Comissão total</p>
                    <p className="text-orange-600 dark:text-orange-400 font-bold text-lg"><Valor>{formatarReais(b.comissaoCentavos)}</Valor></p>
                  </div>
                  {podeMarcarPago &&
                    (pago ? (
                      <form action={desmarcarComissaoPaga.bind(null, id, periodo as "hoje" | "semana" | "mes", chave)}>
                        <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                          ✓ Pago — desmarcar
                        </button>
                      </form>
                    ) : (
                      <form
                        action={marcarComissaoPaga.bind(
                          null,
                          id,
                          periodo as "hoje" | "semana" | "mes",
                          chave,
                          b.comissaoCentavos
                        )}
                      >
                      <button className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-sm font-medium">
                        Marcar como pago
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-1.5">
                  De onde veio a comissão total acima (os 3 valores somados batem com ela):
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 text-xs px-2 py-0.5">
                    <Scissors className="w-3 h-3" /> comissão Corte &amp; Barba <Valor>{formatarReais(b.motorPrincipalCentavos)}</Valor>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5">
                    <Package className="w-3 h-3" /> comissão Produtos <Valor>{formatarReais(b.motorProdutosCentavos)}</Valor>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs px-2 py-0.5">
                    <Sparkles className="w-3 h-3" /> comissão Extras <Valor>{formatarReais(b.motorExtraCentavos)}</Valor>
                  </span>
                </div>
              </div>

              {b.atendimentos.length > 0 && (
                <details className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <summary className="cursor-pointer text-sm text-orange-600 dark:text-orange-400 hover:underline select-none">
                    Ver atendimentos ({b.atendimentos.length})
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {b.atendimentos.map((at, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-neutral-700 dark:text-neutral-200">{at.clienteNome}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs text-right">
                          {at.servicos.join(", ")} · <Valor>{formatarReais(at.valorCentavos)}</Valor> · comissão{" "}
                          <Valor>{formatarReais(at.comissaoCentavos)}</Valor>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
        {porBarbeiro.size === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Serviços mais vendidos no período</h2>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.nome}
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-600 dark:text-orange-400 font-bold w-6 text-center">{i + 1}º</span>
              <span className="font-medium">{r.nome}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{r.qtd}x</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                comissão <Valor>{formatarReais(r.comissaoCentavos)}</Valor>
              </p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum serviço vendido no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-1">Sem nenhuma venda no período</h2>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-3">
        De {atendimentos.length} atendimento(s) concluído(s) no período, estes serviços e produtos ativos não foram
        vendidos nenhuma vez — bom parâmetro pra ver onde a equipe pode oferecer mais.
      </p>
      {servicosSemVenda.length === 0 && produtosSemVenda.length === 0 ? (
        <p className="text-neutral-400 dark:text-neutral-500 text-sm">
          Todos os serviços e produtos ativos tiveram pelo menos uma venda no período. 🎉
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {servicosSemVenda.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm px-3 py-1"
            >
              {s.nome}
            </span>
          ))}
          {produtosSemVenda.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-sm px-3 py-1"
            >
              {p.nome} (produto)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
