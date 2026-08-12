import { prisma } from "@/lib/prisma";
import { NovoProdutoForm } from "./novo-produto-form";
import { ProdutoRow } from "./produto-row";

export default async function ProdutosPage() {
  const produtos = await prisma.produto.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Produtos</h1>

      <NovoProdutoForm />

      <div className="space-y-2">
        {produtos.map((p) => (
          <ProdutoRow key={p.id} produto={p} />
        ))}
        {produtos.length === 0 && <p className="text-slate-400">Nenhum produto cadastrado ainda.</p>}
      </div>
    </div>
  );
}
