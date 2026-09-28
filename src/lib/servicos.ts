// Regra combinada com o Rafael pros "3 motores": corte e barba (avulso ou do
// plano/clube) contam como motor principal; qualquer outro serviço (relaxamento,
// botox, selagem, sobrancelha, etc.) é serviço extra.
export function categoriaPorNome(nome: string): "PRINCIPAL" | "EXTRA" {
  return /corte|barba/i.test(nome) ? "PRINCIPAL" : "EXTRA";
}
