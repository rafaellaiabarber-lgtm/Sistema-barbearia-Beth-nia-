// Classes reaproveitadas nos formulários e cartões do app.
export const CARTAO = "bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm";
export const INPUT =
  "w-full rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-3 text-base outline-none focus:border-orange-500";
export const BOTAO =
  "rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-3";
export const LABEL = "block text-xs text-neutral-400 mb-1";

export function TelaEntrada({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{titulo}</h1>
          {subtitulo && <p className="text-neutral-400 text-sm mt-1">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
