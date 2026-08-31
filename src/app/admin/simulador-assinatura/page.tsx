import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { validarPeriodo, calcularIntervalo } from "@/lib/periodo";
import { Simulador } from "./simulador";

export const dynamic = "force-dynamic";

export default async function SimuladorAssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; dataInicio?: string; dataFim?: string; servicoId?: string }>;
}) {
  const session = await requireSession(["ADMIN"]);
  const sp = await searchParams;
  const periodo = validarPeriodo(sp.periodo, "semana");
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio: sp.dataInicio, dataFim: sp.dataFim });

  const [servicos, barbeiros] = await Promise.all([
    prisma.servico.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, custoCentavos: true, comissaoPercentual: true },
    }),
    prisma.barbeiro.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      select: { comissaoPercentual: true },
    }),
  ]);

  const servicoId = sp.servicoId && servicos.some((s) => s.id === sp.servicoId) ? sp.servicoId : (servicos[0]?.id ?? "");
  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  const comissaoPadrao =
    barbeiros.length > 0
      ? Math.round(barbeiros.reduce((s, b) => s + b.comissaoPercentual, 0) / barbeiros.length)
      : 0;

  let dadosReais = { nAtendimentos: 0, clientesUnicos: 0, faturamentoCentavos: 0, ticketMedioCentavos: 0, frequenciaMediaPorCliente: 0 };
  let intervaloMedioDias: number | null = null;
  let frequenciaRealCortesPorMes: number | null = null;
  if (servico) {
    const itens = await prisma.atendimentoServico.findMany({
      where: {
        barbeariaId: session.barbeariaId,
        servicoId: servico.id,
        atendimento: { status: "CONCLUIDO", cobertoPorAssinatura: false, concluidoEm: { gte: inicio, lte: fim } },
      },
      select: { precoCentavos: true, atendimento: { select: { clienteId: true } } },
    });

    const nAtendimentos = itens.length;
    const clientesUnicos = new Set(itens.map((i) => i.atendimento.clienteId)).size;
    const faturamentoCentavos = itens.reduce((s, i) => s + i.precoCentavos, 0);

    dadosReais = {
      nAtendimentos,
      clientesUnicos,
      faturamentoCentavos,
      ticketMedioCentavos: nAtendimentos > 0 ? Math.round(faturamentoCentavos / nAtendimentos) : 0,
      frequenciaMediaPorCliente: clientesUnicos > 0 ? nAtendimentos / clientesUnicos : 0,
    };

    // A maioria dos clientes avulsos não volta a cada 30 dias certinhos — pra saber o ritmo real de retorno
    // (e não um número redondo chutado), olha pro histórico completo do serviço, não só pro período escolhido acima.
    const historico = await prisma.atendimentoServico.findMany({
      where: {
        barbeariaId: session.barbeariaId,
        servicoId: servico.id,
        atendimento: { status: "CONCLUIDO", cobertoPorAssinatura: false },
      },
      select: { atendimento: { select: { clienteId: true, concluidoEm: true } } },
    });

    const visitasPorCliente = new Map<string, Date[]>();
    for (const h of historico) {
      if (!h.atendimento.concluidoEm) continue;
      const arr = visitasPorCliente.get(h.atendimento.clienteId) ?? [];
      arr.push(h.atendimento.concluidoEm);
      visitasPorCliente.set(h.atendimento.clienteId, arr);
    }

    let somaIntervalosDias = 0;
    let nIntervalos = 0;
    for (const datas of visitasPorCliente.values()) {
      datas.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < datas.length; i++) {
        const dias = (datas[i].getTime() - datas[i - 1].getTime()) / (24 * 60 * 60 * 1000);
        if (dias > 0) {
          somaIntervalosDias += dias;
          nIntervalos++;
        }
      }
    }

    if (nIntervalos > 0) {
      intervaloMedioDias = somaIntervalosDias / nIntervalos;
      frequenciaRealCortesPorMes = 30 / intervaloMedioDias;
    }
  }

  const diasPeriodo = Math.max((fim.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000), 0.5);

  const ticketAvulsoDefault =
    dadosReais.ticketMedioCentavos > 0 ? (dadosReais.ticketMedioCentavos / 100).toFixed(2).replace(".", ",") : "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Simulador de Assinatura</h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
        Escolha o serviço e o período que quer usar como base, ajuste como está sua agenda hoje, e veja o preço
        sugerido do plano ilimitado (teto de 2× o corte avulso) e o faturamento real desse período comparado com o
        que teria sido se parte desses clientes já fosse assinante.
      </p>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Serviço avulso</label>
          <select
            name="servicoId"
            defaultValue={servicoId}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
          >
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Período</label>
          <select
            name="periodo"
            defaultValue={periodo}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
          >
            <option value="hoje">Hoje</option>
            <option value="dia">Um dia específico</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">{periodo === "dia" ? "Dia" : "De"}</label>
          <input
            type="date"
            name="dataInicio"
            defaultValue={sp.dataInicio}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
          />
        </div>
        {periodo !== "dia" && (
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Até</label>
            <input
              type="date"
              name="dataFim"
              defaultValue={sp.dataFim}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
        )}
        <button type="submit" className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 text-sm">
          Buscar
        </button>
      </form>

      <Simulador
        servico={servico}
        comissaoPadrao={comissaoPadrao}
        dadosReais={dadosReais}
        diasPeriodo={diasPeriodo}
        ticketAvulsoDefault={ticketAvulsoDefault}
        intervaloMedioDias={intervaloMedioDias}
        frequenciaRealCortesPorMes={frequenciaRealCortesPorMes}
      />
    </div>
  );
}
