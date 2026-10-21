import { prisma } from "@/lib/prisma";
import { requireBarbeariaBySlug } from "@/lib/tenant";
import { estaPausadoHoje } from "@/lib/periodo";
import { AgendaWizard } from "./agenda-wizard";

export const dynamic = "force-dynamic";

export default async function AgendarPage({ params }: { params: Promise<{ barbeariaSlug: string }> }) {
  const { barbeariaSlug } = await params;
  const barbearia = await requireBarbeariaBySlug(barbeariaSlug);

  const [todosBarbeiros, servicos] = await Promise.all([
    prisma.barbeiro.findMany({ where: { ativo: true, barbeariaId: barbearia.id }, orderBy: { nome: "asc" } }),
    prisma.servico.findMany({ where: { ativo: true, barbeariaId: barbearia.id }, orderBy: { nome: "asc" } }),
  ]);
  const barbeiros = todosBarbeiros.filter((b) => !estaPausadoHoje(b.pausadoEm));

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AgendaWizard
        barbeariaSlug={barbearia.slug}
        barbeariaNome={barbearia.nome}
        barbeiros={barbeiros.map((b) => ({ id: b.id, nome: b.nome }))}
        servicos={servicos.map((s) => ({ id: s.id, nome: s.nome, duracaoMinutos: s.duracaoMinutos, precoCentavos: s.precoCentavos }))}
      />
    </div>
  );
}
