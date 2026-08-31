import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { marcarGiroResgatado } from "@/lib/actions/roleta";
import { textoPremioRoleta } from "@/lib/roleta";
import { NovaOfertaForm } from "./nova-oferta-form";
import { OfertaRow } from "./oferta-row";
import { BarbeiroQr } from "./barbeiro-qr";

export const dynamic = "force-dynamic";

export default async function RoletaAdminPage() {
  const session = await requireSession(["ADMIN"]);
  const [ofertas, barbeiros, giros] = await Promise.all([
    prisma.ofertaRoleta.findMany({
      where: { barbeariaId: session.barbeariaId },
      orderBy: [{ ativo: "desc" }, { ordem: "asc" }],
    }),
    prisma.barbeiro.findMany({ where: { ativo: true, barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
    prisma.giroRoleta.findMany({
      where: { barbeariaId: session.barbeariaId },
      include: { cliente: true, barbeiro: true, oferta: true },
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
  ]);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocolo}://${host}`;

  const pendentes = giros.filter((g) => !g.resgatadoEm);
  const resgatados = giros.filter((g) => g.resgatadoEm);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Roleta de Prêmios</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Cadastre até 6 prêmios ativos por vez. Cada barbeiro tem um link/QR Code próprio — o cliente escaneia,
        gira a roleta e ganha um prêmio. Quando ele voltar pra usar, um aviso aparece na Fila.
      </p>

      <h2 className="text-lg font-semibold mb-3">Prêmios da roleta</h2>
      <NovaOfertaForm />
      <div className="space-y-2 mb-8">
        {ofertas.map((o) => (
          <OfertaRow key={o.id} oferta={o} />
        ))}
        {ofertas.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum prêmio cadastrado ainda.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">QR Code por barbeiro</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {barbeiros.map((b) => (
          <BarbeiroQr key={b.id} barbeiroId={b.id} nome={b.nome} baseUrl={baseUrl} barbeariaSlug={session.barbeariaSlug} />
        ))}
        {barbeiros.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum barbeiro ativo.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Prêmios pendentes de resgate ({pendentes.length})</h2>
      <div className="space-y-2 mb-8">
        {pendentes.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm"
          >
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {g.cliente.nome} — {textoPremioRoleta(g.oferta)}
              </p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                {g.cliente.telefone} · girou com {g.barbeiro.nome} · {g.criadoEm.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <form action={marcarGiroResgatado.bind(null, g.id)}>
              <button className="text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5">
                Marcar resgatado
              </button>
            </form>
          </div>
        ))}
        {pendentes.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum prêmio pendente.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Resgatados recentemente</h2>
      <div className="space-y-2">
        {resgatados.slice(0, 15).map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm opacity-60"
          >
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {g.cliente.nome} — {textoPremioRoleta(g.oferta)}
              </p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                girou com {g.barbeiro.nome} · resgatado em {g.resgatadoEm?.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span className="text-green-600 text-sm font-semibold">✓ resgatado</span>
          </div>
        ))}
        {resgatados.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum prêmio resgatado ainda.</p>}
      </div>
    </div>
  );
}
