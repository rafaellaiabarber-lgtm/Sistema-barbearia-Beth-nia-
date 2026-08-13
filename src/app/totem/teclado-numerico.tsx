"use client";

function formatarTelefoneExibicao(digitos: string) {
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`;
}

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function TecladoNumerico({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (novoValor: string) => void;
}) {
  function apertar(tecla: string) {
    if (tecla === "") return;
    if (tecla === "⌫") {
      onChange(valor.slice(0, -1));
      return;
    }
    if (valor.length >= 11) return;
    onChange(valor + tecla);
  }

  return (
    <div>
      <div className="w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-3xl tracking-wide text-center px-4 py-4 mb-6 min-h-[4rem] flex items-center justify-center">
        {valor ? formatarTelefoneExibicao(valor) : <span className="text-slate-300">(11) 99999-9999</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {TECLAS.map((tecla, i) =>
          tecla === "" ? (
            <div key={`vazio-${i}`} />
          ) : (
            <button
              key={tecla}
              type="button"
              onClick={() => apertar(tecla)}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-lime-400 active:text-slate-950 active:scale-95 text-slate-900 text-2xl font-bold py-4 transition-all"
            >
              {tecla}
            </button>
          )
        )}
      </div>
    </div>
  );
}
