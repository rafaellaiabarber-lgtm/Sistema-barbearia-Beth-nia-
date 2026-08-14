"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function ValoresToggle({ className = "" }: { className?: string }) {
  const [ocultos, setOcultos] = useState(false);

  useEffect(() => {
    setOcultos(document.documentElement.classList.contains("ocultar-valores"));
  }, []);

  function alternar() {
    const novoOcultos = !ocultos;
    setOcultos(novoOcultos);
    document.documentElement.classList.toggle("ocultar-valores", novoOcultos);
    localStorage.setItem("valoresOcultos", novoOcultos ? "sim" : "nao");
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={ocultos ? "Mostrar valores" : "Esconder valores"}
      title={ocultos ? "Mostrar valores" : "Esconder valores"}
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${className}`}
    >
      {ocultos ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
}
