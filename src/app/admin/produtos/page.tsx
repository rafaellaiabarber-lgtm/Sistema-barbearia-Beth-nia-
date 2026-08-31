import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { NovoProdutoForm } from "./novo-produto-form";
import { ProdutoRow } from "./produto-row";

export default async function ProdutosPage() {
  const session = await requireSession(["ADMIN"]);
  const produtos = await prisma.produto.findMany({
    where: { barbeariaId: session.barbeariaId },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Produtos</h1>

      <NovoProdutoForm />

      <div className="space-y-2">
        {produtos.map((p) => (
          <ProdutoRow key={p.id} produto={p} />
        ))}
        {produtos.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum produto cadastrado ainda.</p>}
      </div>
    </div>
  );
}
