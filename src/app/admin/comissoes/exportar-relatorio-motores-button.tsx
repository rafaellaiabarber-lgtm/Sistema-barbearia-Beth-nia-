"use client";

import { useState } from "react";

type BarbeiroMotores = {
  nome: string;
  clientesAtendidos: number;
  qtdExtras: number;
  extras: { nome: string; qtd: number }[];
  qtdProdutos: number;
  produtos: { nome: string; qtd: number }[];
};

export function ExportarRelatorioMotoresButton({
  barbeariaNome,
  periodoLabel,
  barbeiros,
}: {
  barbeariaNome: string;
  periodoLabel: string;
  barbeiros: BarbeiroMotores[];
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
        doc.text("Atendimentos e vendas por barbeiro (os 3 motores)", 20, 30);
        doc.setFontSize(10);
        doc.text(`Período: ${periodoLabel}`, 20, 38);
      }

      function precisaNovaPagina(y: number, espacoNecessario: number) {
        if (y > alturaPagina - espacoNecessario) {
          doc.addPage();
          cabecalho();
          return 52;
        }
        return y;
      }

      cabecalho();
      let y = 52;
      for (const b of barbeiros) {
        y = precisaNovaPagina(y, 40);
        doc.setFontSize(12);
        doc.text(b.nome, 20, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Clientes atendidos: ${b.clientesAtendidos}`, 20, y);
        y += 6;

        doc.text(`Produtos vendidos: ${b.qtdProdutos}`, 20, y);
        y += 6;
        for (const p of b.produtos) {
          y = precisaNovaPagina(y, 20);
          doc.setFontSize(9);
          doc.text(`- ${p.nome}: ${p.qtd}`, 26, y);
          y += 5;
        }
        if (b.produtos.length === 0) {
          doc.setFontSize(9);
          doc.text("- nenhum produto vendido no período", 26, y);
          y += 5;
        }

        doc.setFontSize(10);
        y += 1;
        doc.text(`Serviços extras vendidos: ${b.qtdExtras}`, 20, y);
        y += 6;
        for (const e of b.extras) {
          y = precisaNovaPagina(y, 20);
          doc.setFontSize(9);
          doc.text(`- ${e.nome}: ${e.qtd}`, 26, y);
          y += 5;
        }
        if (b.extras.length === 0) {
          doc.setFontSize(9);
          doc.text("- nenhum serviço extra vendido no período", 26, y);
          y += 5;
        }

        y += 8;
      }
      if (barbeiros.length === 0) {
        doc.setFontSize(10);
        doc.text("Nenhum atendimento no período.", 20, y);
      }

      doc.setFontSize(9);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 20, alturaPagina - 12);

      doc.save(`atendimentos-vendas-barbeiros-${new Date().toISOString().slice(0, 10)}.pdf`);
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
      {gerandoPdf ? "Gerando..." : "📋 Baixar PDF de atendimentos e vendas"}
    </button>
  );
}
