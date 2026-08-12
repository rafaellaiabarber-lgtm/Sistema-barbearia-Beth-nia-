import { formatarReais } from "@/lib/format";

export function GraficoBarras({ dados }: { dados: { label: string; valor: number }[] }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const alturaContainer = 160;

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: alturaContainer }}>
        {dados.map((d, i) => {
          const alturaPx = d.valor > 0 ? Math.max(Math.round((d.valor / max) * (alturaContainer - 10)), 3) : 0;
          return (
            <div key={i} className="flex-1 h-full flex items-end group relative">
              <div
                className="w-full bg-blue-500 group-hover:bg-blue-600 rounded-t transition-colors"
                style={{ height: alturaPx }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {d.label}: {formatarReais(d.valor)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {dados.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
