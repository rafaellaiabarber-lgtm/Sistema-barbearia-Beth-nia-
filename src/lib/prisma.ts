import { PrismaClient } from "@prisma/client";
import { getCurrentBarbeariaId } from "./tenant-context";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const basePrisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}

// Toda vez que a barbearia atual estiver definida (via requireSession ou a resolução
// de barbearia das rotas públicas), essa extensão injeta barbeariaId automaticamente
// em toda consulta desses modelos — uma rede de segurança contra esquecer de escopar
// alguma consulta, além (não em vez) do escopo explícito já feito em cada call-site.
//
// Os 4 modelos de configuração (ConfiguracaoTotem/Avaliacao/Financeira/Ranking) ficam
// de fora de propósito: neles barbeariaId já é a própria chave primária, então toda
// consulta por barbeariaId já é inerentemente escopada, sem precisar de injeção.
//
// Limitação conhecida: essa extensão só intercepta a operação no nível do modelo —
// não alcança escritas aninhadas (ex.: `campanhaVenda.create({ data: { itens: { create: [...] } } })`).
// Esses casos (campanhas.ts, pote.ts, metas.ts, fila.ts, atendimentos.ts) já foram
// corrigidos manualmente, escrevendo barbeariaId explicitamente em cada item aninhado.
const MODELS_COM_BARBEARIA_ID = new Set<string>([
  "Usuario",
  "Barbeiro",
  "JornadaTrabalho",
  "Indicacao",
  "DespesaBarbeiro",
  "Meta",
  "NivelMeta",
  "Cliente",
  "Servico",
  "Produto",
  "CampanhaVenda",
  "ItemCampanhaVenda",
  "VendaProduto",
  "Atendimento",
  "MovimentoCaixa",
  "PagamentoComissao",
  "AtendimentoServico",
  "Plano",
  "Assinatura",
  "PagamentoAssinatura",
  "DistribuicaoPote",
  "ItemDistribuicaoPote",
  "ContaFinanceira",
  "MaterialTreinamento",
  "TemaFeedback",
  "Feedback",
  "OfertaRoleta",
  "GiroRoleta",
]);

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const barbeariaId = getCurrentBarbeariaId();
        if (!barbeariaId || !model || !MODELS_COM_BARBEARIA_ID.has(model)) {
          return query(args);
        }

        const argsComEscopo = args as Record<string, unknown>;

        if (operation === "create") {
          const data = (argsComEscopo.data ?? {}) as Record<string, unknown>;
          argsComEscopo.data = { barbeariaId, ...data };
        } else if (operation === "createMany") {
          const data = (argsComEscopo.data ?? []) as Record<string, unknown>[];
          argsComEscopo.data = data.map((item) => ({ barbeariaId, ...item }));
        } else {
          const where = (argsComEscopo.where ?? {}) as Record<string, unknown>;
          argsComEscopo.where = { ...where, barbeariaId };
          if (operation === "upsert") {
            const create = (argsComEscopo.create ?? {}) as Record<string, unknown>;
            argsComEscopo.create = { barbeariaId, ...create };
          }
        }

        return query(argsComEscopo as never);
      },
    },
  },
});
