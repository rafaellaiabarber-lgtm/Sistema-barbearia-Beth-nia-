import { prisma } from "@/lib/prisma";
import { ListaClientes } from "./lista-clientes";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      atendimentos: {
        where: { status: "CONCLUIDO" },
        orderBy: { concluidoEm: "desc" },
        include: { servicos: true, barbeiro: true },
      },
      assinaturas: { where: { status: "ATIVA" }, include: { plano: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <ListaClientes clientes={clientes} />
    </div>
  );
}
