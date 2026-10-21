"use client";

import { excluirBloqueioAgenda } from "@/lib/actions/agenda";

function formatarPeriodo(inicio: Date, fim: Date) {
  const mesmoDia = inicio.toDateString() === fim.toDateString();
  const diaTodo = inicio.getHours() === 0 && inicio.getMinutes() === 0 && fim.getHours() === 23 && fim.getMinutes() === 59;
  const dataInicio = inicio.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  if (diaTodo && mesmoDia) return `${dataInicio} (dia todo)`;
  const horaInicio = inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const horaFim = fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia) return `${dataInicio}, ${horaInicio}–${horaFim}`;
  const dataFim = fim.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  return `${dataInicio} ${horaInicio} até ${dataFim} ${horaFim}`;
}

export function BloqueioRow({
  id,
  inicio,
  fim,
  motivo,
  barbeiroNome,
}: {
  id: string;
  inicio: Date;
  fim: Date;
  motivo: string | null;
  barbeiroNome?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div>
        <p className="font-semibold">
          {barbeiroNome && <span className="text-neutral-500 dark:text-neutral-400 font-normal">{barbeiroNome} · </span>}
          {formatarPeriodo(inicio, fim)}
        </p>
        {motivo && <p className="text-neutral-500 dark:text-neutral-400 text-sm">{motivo}</p>}
      </div>
      <form action={excluirBloqueioAgenda.bind(null, id)}>
        <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
      </form>
    </div>
  );
}
