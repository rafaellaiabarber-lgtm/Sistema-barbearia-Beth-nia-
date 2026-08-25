"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { OfertaRoleta } from "@prisma/client";
import { girarRoleta, type GirarRoletaState } from "@/lib/actions/roleta";
import { textoPremioRoleta } from "@/lib/roleta";

const estadoInicial: GirarRoletaState = {};

const CORES = ["#7c3aed", "#db2777", "#84cc16", "#dc2626", "#0ea5e9", "#f59e0b"];

export function RoletaWheel({
  barbeiroId,
  barbeiroNome,
  ofertas,
}: {
  barbeiroId: string;
  barbeiroNome: string;
  ofertas: OfertaRoleta[];
}) {
  const acaoComId = girarRoleta.bind(null, barbeiroId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const [etapa, setEtapa] = useState<"form" | "girando" | "resultado">("form");
  const [rotacao, setRotacao] = useState(0);
  const giroProcessado = useRef(false);

  const n = ofertas.length;
  const anguloPorFatia = n > 0 ? 360 / n : 0;

  useEffect(() => {
    if (estado.sucesso && estado.ofertaId && !giroProcessado.current) {
      giroProcessado.current = true;
      const indice = ofertas.findIndex((o) => o.id === estado.ofertaId);
      const centro = indice >= 0 ? (indice + 0.5) * anguloPorFatia : 0;
      const alvo = 1800 + (360 - centro);
      setEtapa("girando");
      requestAnimationFrame(() => setRotacao(alvo));
      const timer = setTimeout(() => setEtapa("resultado"), 4200);
      return () => clearTimeout(timer);
    }
  }, [estado, ofertas, anguloPorFatia]);

  if (n === 0) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-white">A roleta de {barbeiroNome} ainda não tem prêmios cadastrados.</p>
      </div>
    );
  }

  const gradiente = ofertas.map((_, i) => `${CORES[i % CORES.length]} ${i * anguloPorFatia}deg ${(i + 1) * anguloPorFatia}deg`).join(", ");

  return (
    <div className="w-full max-w-sm flex flex-col items-center text-center">
      <p className="text-neutral-400 text-sm mb-1">Roleta de prêmios de</p>
      <h1 className="text-white text-2xl font-bold mb-6">{barbeiroNome}</h1>

      {etapa === "form" && (
        <form action={formAction} className="w-full space-y-3">
          <input
            name="nome"
            required
            placeholder="Seu nome"
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-3 text-center"
          />
          <input
            name="telefone"
            required
            placeholder="Seu telefone (WhatsApp)"
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-3 text-center"
          />
          {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-black font-bold text-lg py-4"
          >
            {pendente ? "Girando..." : "Girar a roleta"}
          </button>
        </form>
      )}

      {(etapa === "girando" || etapa === "resultado") && (
        <div className="relative w-72 h-72">
          <div
            className="absolute -top-2 left-1/2 -tranneutral-x-1/2 z-10"
            style={{
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "22px solid #facc15",
            }}
          />
          <div
            className="w-72 h-72 rounded-full border-4 border-neutral-700 relative overflow-hidden"
            style={{
              background: `conic-gradient(${gradiente})`,
              transform: `rotate(${rotacao}deg)`,
              transition: "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)",
            }}
          >
            {ofertas.map((o, i) => {
              const anguloLabel = (i + 0.5) * anguloPorFatia;
              return (
                <span
                  key={o.id}
                  className="absolute left-1/2 top-1/2 text-white text-xs font-semibold whitespace-nowrap"
                  style={{
                    transform: `rotate(${anguloLabel}deg) translate(0, -100px) rotate(${-anguloLabel}deg)`,
                    transformOrigin: "0 0",
                  }}
                >
                  {textoPremioRoleta(o)}
                </span>
              );
            })}
          </div>
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-neutral-900 border-4 border-neutral-700 flex items-center justify-center text-white text-xs font-bold">
            {etapa === "girando" ? "..." : "🎉"}
          </div>
        </div>
      )}

      {etapa === "resultado" && (
        <div className="mt-6 bg-lime-400 rounded-2xl p-5 w-full">
          <p className="text-black font-bold text-lg">Parabéns! 🎉</p>
          <p className="text-black text-sm mt-1">
            Você ganhou: <span className="font-bold">{estado.ofertaNome}</span>
          </p>
          <p className="text-black/70 text-xs mt-2">
            Mostre essa tela pro {barbeiroNome} na sua próxima visita pra resgatar.
          </p>
        </div>
      )}
    </div>
  );
}
