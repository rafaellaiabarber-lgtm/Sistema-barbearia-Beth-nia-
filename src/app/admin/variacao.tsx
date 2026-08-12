export function Variacao({ atual, anterior, claro }: { atual: number; anterior: number; claro?: boolean }) {
  if (anterior === 0) {
    if (atual === 0) return null;
    return (
      <span className={`text-xs font-medium ${claro ? "text-white/90" : "text-green-600"}`}>novo</span>
    );
  }

  const percentual = ((atual - anterior) / Math.abs(anterior)) * 100;
  const positivo = percentual >= 0;

  const corClaro = "text-white/90";
  const corEscuro = positivo ? "text-green-600" : "text-red-600";

  return (
    <span className={`text-xs font-medium ${claro ? corClaro : corEscuro}`}>
      {positivo ? "▲" : "▼"} {Math.abs(percentual).toFixed(0)}% vs período anterior
    </span>
  );
}
