export function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  if (anterior === 0) {
    if (atual === 0) return null;
    return <span className="text-green-600 text-xs font-medium">novo</span>;
  }

  const percentual = ((atual - anterior) / Math.abs(anterior)) * 100;
  const positivo = percentual >= 0;

  return (
    <span className={`text-xs font-medium ${positivo ? "text-green-600" : "text-red-600"}`}>
      {positivo ? "▲" : "▼"} {Math.abs(percentual).toFixed(0)}% vs período anterior
    </span>
  );
}
