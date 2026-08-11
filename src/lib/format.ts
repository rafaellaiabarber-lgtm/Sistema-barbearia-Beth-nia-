export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function reaisParaCentavos(valor: string) {
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  if (Number.isNaN(numero)) return 0;
  return Math.round(numero * 100);
}
