"use client";

import { useState } from "react";
import { LABEL_FORMA_PAGAMENTO } from "@/lib/format";

const OPCOES = ["DINHEIRO", "PIX", "CARTAO"] as const;

export function SeletorFormaPagamento({
  nome = "formaPagamento",
  valorInicial,
}: {
  nome?: string;
  valorInicial?: string | null;
}) {
  const [selecionado, setSelecionado] = useState<string | null>(valorInicial ?? null);

  return (
    <div>
      <input type="hidden" name={nome} value={selecionado ?? ""} />
      <div className="flex gap-2">
        {OPCOES.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setSelecionado(op)}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors ${
              selecionado === op
                ? "border-lime-600 bg-lime-50 text-lime-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {LABEL_FORMA_PAGAMENTO[op]}
          </button>
        ))}
      </div>
    </div>
  );
}
