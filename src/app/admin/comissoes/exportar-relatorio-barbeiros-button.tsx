"use client";

import { useState } from "react";
import { formatarReais } from "@/lib/format";

export function ExportarRelatorioBarbeirosButton({
  barbeariaNome,
  periodoLabel,
  barbeiros,
}: {
  barbeariaNome: string;
  periodoLabel: string;
  barbeiros: { nome: string; qtd: number; totalCentavos: number; comissaoCentavos: number }[];
}) {
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function exportarPdf() {
    setGerandoPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const alturaPagina = doc.internal.pageSize.getHeight();

      function cabecalho() {
        doc.setFontSize(16);
        doc.text(barbeariaNome, 20, 20);
        doc.setFontSize(12);
        doc.text("Desempenho por barbeiro", 20, 30);
        doc.setFontSize(10);
        doc.text(`Período: ${periodoLabel}`, 20, 38);
      }

      cabecalho();
      let y = 52;
      for (const b of barbeiros) {
        if (y > alturaPagina - 30) {
          doc.addPage();
          cabecalho();
          y = 52;
        }
        doc.setFontSize(12);
        doc.text(b.nome, 20, y);
        doc.setFontSize(10);
        doc.text(
          `${b.qtd} atendimento(s) · faturamento ${formatarReais(b.totalCentavos)} · comissão ${formatarReais(b.comissaoCentavos)}`,
          20,
          y + 7
        );
        y += 18;
      }
      if (barbeiros.length === 0) {
        doc.setFontSize(10);
        doc.text("Nenhum atendimento no período.", 20, y);
      }

      doc.setFontSize(9);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 20, alturaPagina - 12);

      doc.save(`desempenho-barbeiros-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportarPdf}
      disabled={gerandoPdf}
      className="rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60 border border-neutral-300 dark:border-neutral-600 text-sm font-medium px-4 py-2"
    >
      {gerandoPdf ? "Gerando..." : "📄 Baixar PDF do período"}
    </button>
  );
}
