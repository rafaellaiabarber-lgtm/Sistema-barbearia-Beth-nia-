import { AsyncLocalStorage } from "node:async_hooks";

type TenantStore = { barbeariaId: string };

const tenantContext = new AsyncLocalStorage<TenantStore>();

export function getCurrentBarbeariaId(): string | null {
  return tenantContext.getStore()?.barbeariaId ?? null;
}

// Usa enterWith (não run) porque o código que resolve a barbearia (requireSession,
// obterBarbeariaPadrao) não está estruturado como um callback aninhado — ele só
// precisa que o contexto valha dali pra frente, dentro da mesma requisição.
export function setCurrentBarbearia(barbeariaId: string) {
  tenantContext.enterWith({ barbeariaId });
}
