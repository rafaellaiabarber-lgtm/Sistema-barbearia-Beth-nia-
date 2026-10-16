import { requireSession } from "@/lib/session";
import { analisarEtapas } from "@/lib/cronometro";
import { buscarRegistros, buscarTecnicasAtivas, diasAtras } from "@/lib/cronometro-server";
import { Cronometro } from "./cronometro";
import { CardAnaliseEtapas } from "./analise-etapas";

export default async function CronometroPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const desde = diasAtras(30);

  const [tecnicas, registrosEquipe] = await Promise.all([
    buscarTecnicasAtivas(session.barbeariaId),
    buscarRegistros(session.barbeariaId, { desde }),
  ]);
  const meus = registrosEquipe.filter((r) => r.barbeiroId === session.barbeiroId);
  const outros = registrosEquipe.filter((r) => r.barbeiroId !== session.barbeiroId);

  return (
    <div className="space-y-5">
      <Cronometro
        tecnicas={tecnicas.map((t) => ({
          id: t.id,
          nome: t.nome,
          passos: t.passos.map((p) => ({ id: p.id, etapa: p.etapa, texto: p.texto })),
        }))}
        podeRegistrar={!!session.barbeiroId}
      />
      {session.barbeiroId && (
        <CardAnaliseEtapas analise={analisarEtapas(meus, outros)} titulo="Onde você perde mais tempo (30 dias)" />
      )}
    </div>
  );
}
