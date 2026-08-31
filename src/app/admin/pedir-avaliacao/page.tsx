import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ClienteAvaliacaoRow } from "../../cliente-avaliacao-row";
import { LinkGoogleForm } from "./link-google-form";
import { buscarAtendimentosParaAvaliacao, MINUTOS_MINIMO_AVALIACAO, HORAS_MAXIMO_AVALIACAO } from "@/lib/avaliacao";

export const dynamic = "force-dynamic";

export default async function PedirAvaliacaoPage() {
  const session = await requireSession(["ADMIN"]);
  const agora = new Date();

  const [atendimentos, configuracao] = await Promise.all([
    buscarAtendimentosParaAvaliacao(),
    prisma.configuracaoAvaliacao.findUnique({ where: { barbeariaId: session.barbeariaId } }),
  ]);
  const linkGoogle = configuracao?.linkGoogle ?? null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pedir Avaliação</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Clientes que terminaram o atendimento entre {MINUTOS_MINIMO_AVALIACAO} minutos e {HORAS_MAXIMO_AVALIACAO}{" "}
        horas atrás — a hora certa de pedir pra eles avaliarem o serviço, com uma mensagem já pronta pra mandar no
        WhatsApp.
      </p>

      <LinkGoogleForm linkAtual={linkGoogle} />

      <div className="space-y-2">
        {atendimentos.map((a) => (
          <ClienteAvaliacaoRow
            key={a.id}
            nome={a.cliente.nome}
            telefone={a.cliente.telefone!}
            barbeiroNome={a.barbeiro!.nome}
            servicos={a.servicos.map((s) => s.nomeSnapshot)}
            minutosAtras={Math.floor((agora.getTime() - a.concluidoEm!.getTime()) / 60000)}
            linkGoogle={linkGoogle}
          />
        ))}
        {atendimentos.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            Nenhum cliente nessa janela de tempo agora — volte a checar daqui a pouco.
          </p>
        )}
      </div>
    </div>
  );
}
