import { requireUsuario } from "@/lib/session";
import { analisarEtapas } from "@/lib/cronometro";
import { buscarRegistros, buscarTecnicasAtivas, diasAtras } from "@/lib/cronometro-server";
import { CardAnaliseEtapas } from "@/components/analise-etapas";
import { Cronometro } from "./cronometro";

export default async function CronometroPage() {
  const eu = await requireUsuario();
  const [tecnicas, registrosTurma] = await Promise.all([buscarTecnicasAtivas(), buscarRegistros({ desde: diasAtras(30) })]);
  const meus = registrosTurma.filter((r) => r.usuarioId === eu.id);
  const outros = registrosTurma.filter((r) => r.usuarioId !== eu.id);

  return (
    <div className="space-y-5">
      <Cronometro
        tecnicas={tecnicas.map((t) => ({
          id: t.id,
          nome: t.nome,
          passos: t.passos.map((p) => ({ id: p.id, etapa: p.etapa, texto: p.texto })),
        }))}
      />
      <CardAnaliseEtapas analise={analisarEtapas(meus, outros)} titulo="Onde você perde mais tempo (30 dias)" />
    </div>
  );
}
