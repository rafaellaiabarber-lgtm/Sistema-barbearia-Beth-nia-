import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatarReais } from "@/lib/format";
import { comissaoServicos } from "@/lib/comissao";
import { Variacao } from "../variacao";
import { Valor } from "../../valor";

function paraCampoData(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function intervaloDoDia(dataStr: string) {
  return { inicio: new Date(`${dataStr}T00:00:00`), fim: new Date(`${dataStr}T23:59:59.999`) };
}

function formatarDataBR(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function buscarMetricas(barbeariaId: string, inicio: Date, fim: Date) {
  const atendimentos = await prisma.atendimento.findMany({
    where: { barbeariaId, status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim } },
    include: { barbeiro: true, servicos: true },
  });
  const faturamentoCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const qtd = atendimentos.length;
  const ticketMedioCentavos = qtd > 0 ? Math.round(faturamentoCentavos / qtd) : 0;
  const comissaoCentavos = atendimentos.reduce(
    (s, a) => s + (a.barbeiro ? comissaoServicos(a.servicos, a.barbeiro.comissaoPercentual) : 0),
    0
  );
  return { faturamentoCentavos, qtd, ticketMedioCentavos, comissaoCentavos };
}

export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{
    dataInicioA?: string;
    dataFimA?: string;
    dataInicioB?: string;
    dataFimB?: string;
  }>;
}) {
  const session = await requireSession(["ADMIN"]);
  const { dataInicioA, dataFimA, dataInicioB, dataFimB } = await searchParams;

  const hoje = new Date();
  const umMesAtras = new Date(hoje);
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);

  const inicioAStr = dataInicioA || paraCampoData(hoje);
  const fimAStr = dataFimA || inicioAStr;
  const inicioBStr = dataInicioB || paraCampoData(umMesAtras);
  const fimBStr = dataFimB || inicioBStr;

  const intervaloA = { inicio: intervaloDoDia(inicioAStr).inicio, fim: intervaloDoDia(fimAStr).fim };
  const intervaloB = { inicio: intervaloDoDia(inicioBStr).inicio, fim: intervaloDoDia(fimBStr).fim };

  const [metricasA, metricasB] = await Promise.all([
    buscarMetricas(session.barbeariaId, intervaloA.inicio, intervaloA.fim),
    buscarMetricas(session.barbeariaId, intervaloB.inicio, intervaloB.fim),
  ]);

  const labelA =
    inicioAStr === fimAStr ? formatarDataBR(inicioAStr) : `${formatarDataBR(inicioAStr)} até ${formatarDataBR(fimAStr)}`;
  const labelB =
    inicioBStr === fimBStr ? formatarDataBR(inicioBStr) : `${formatarDataBR(inicioBStr)} até ${formatarDataBR(fimBStr)}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Comparativo de períodos</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Escolha duas datas (ou dois intervalos) pra comparar — por exemplo, hoje com o mesmo dia do mês passado, ou
        uma semana com a semana equivalente do mês anterior.
      </p>

      <form
        method="get"
        className="flex flex-wrap items-end gap-6 mb-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-3">
          <p className="w-full text-xs font-semibold text-neutral-500 dark:text-neutral-400">Período A</p>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">De</label>
            <input
              type="date"
              name="dataInicioA"
              defaultValue={inicioAStr}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Até</label>
            <input
              type="date"
              name="dataFimA"
              defaultValue={fimAStr}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <p className="w-full text-xs font-semibold text-neutral-500 dark:text-neutral-400">Período B</p>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">De</label>
            <input
              type="date"
              name="dataInicioB"
              defaultValue={inicioBStr}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Até</label>
            <input
              type="date"
              name="dataFimB"
              defaultValue={fimBStr}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 text-sm"
        >
          Comparar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">Período A — {labelA}</p>
          <div className="space-y-4">
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Faturamento</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                <Valor>{formatarReais(metricasA.faturamentoCentavos)}</Valor>
              </p>
              <Variacao atual={metricasA.faturamentoCentavos} anterior={metricasB.faturamentoCentavos} />
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Atendimentos</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{metricasA.qtd}</p>
              <Variacao atual={metricasA.qtd} anterior={metricasB.qtd} />
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Ticket médio</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                <Valor>{formatarReais(metricasA.ticketMedioCentavos)}</Valor>
              </p>
              <Variacao atual={metricasA.ticketMedioCentavos} anterior={metricasB.ticketMedioCentavos} />
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Comissões</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                <Valor>{formatarReais(metricasA.comissaoCentavos)}</Valor>
              </p>
              <Variacao atual={metricasA.comissaoCentavos} anterior={metricasB.comissaoCentavos} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">Período B — {labelB}</p>
          <div className="space-y-4">
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Faturamento</p>
              <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-200">
                <Valor>{formatarReais(metricasB.faturamentoCentavos)}</Valor>
              </p>
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Atendimentos</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{metricasB.qtd}</p>
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Ticket médio</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                <Valor>{formatarReais(metricasB.ticketMedioCentavos)}</Valor>
              </p>
            </div>
            <div>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">Comissões</p>
              <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                <Valor>{formatarReais(metricasB.comissaoCentavos)}</Valor>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
