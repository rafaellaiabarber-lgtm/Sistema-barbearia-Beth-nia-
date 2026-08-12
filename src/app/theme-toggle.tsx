"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const novoEscuro = !escuro;
    setEscuro(novoEscuro);
    document.documentElement.classList.toggle("dark", novoEscuro);
    localStorage.setItem("tema", novoEscuro ? "escuro" : "claro");
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Mudar pra modo claro" : "Mudar pra modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${className}`}
    >
      {escuro ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
