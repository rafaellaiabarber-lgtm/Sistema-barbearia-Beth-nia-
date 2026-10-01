"use client";

import { useState } from "react";
import { formatarReais } from "@/lib/format";

type ItemComQtd = { nome: string; qtd: number };

type BarbeiroDetalhado = {
  nome: string;
  atendimentos: number;
  comissaoCentavos: number;
  qtdProdutos: number;
  produtos: ItemComQtd[];
  qtdExtras: number;
  extras: ItemComQtd[];
};

function taxaConversao(qtd: number, atendimentos: number) {
  if (atendimentos <= 0 || qtd <= 0) return { percentual: 0, label: "sem vendas no período" };
  const percentual = (qtd / atendimentos) * 100;
  const aCadaX = Math.round(atendimentos / qtd);
  return { percentual, label: `${percentual.toFixed(0)}% dos atendimentos · 1 a cada ${aCadaX} atendimento(s)` };
}

export function ExportarRelatorioDetalhadoButton({
  barbeariaNome,
  periodoLabel,
  barbeiros,
}: {
  barbeariaNome: string;
  periodoLabel: string;
  barbeiros: BarbeiroDetalhado[];
}) {
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function exportarPdf() {
    setGerandoPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margemEsquerda = 20;
      const larguraBarra = 80;
      const alturaPagina = doc.internal.pageSize.getHeight();

      function cabecalho() {
        doc.setFontSize(16);
        doc.text(barbeariaNome, margemEsquerda, 20);
        doc.setFontSize(12);
        doc.text("Relatório detalhado por barbeiro", margemEsquerda, 30);
        doc.setFontSize(10);
        doc.text(`Período: ${periodoLabel}`, margemEsquerda, 38);
      }

      function espacoOuNovaPagina(y: number, espacoNecessario: number) {
        if (y > alturaPagina - espacoNecessario) {
          doc.addPage();
          cabecalho();
          return 52;
        }
        return y;
      }

      function barraConversao(y: number, percentual: number) {
        const pct = Math.max(0, Math.min(100, percentual));
        doc.setFillColor(230, 230, 230);
        doc.rect(margemEsquerda, y, larguraBarra, 3, "F");
        doc.setFillColor(234, 88, 12);
        doc.rect(margemEsquerda, y, (larguraBarra * pct) / 100, 3, "F");
      }

      cabecalho();
      let y = 52;
      for (const b of barbeiros) {
        y = espacoOuNovaPagina(y, 45);
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text(b.nome, margemEsquerda, y);
        y += 7;

        doc.setFontSize(10);
        doc.text(`Atendimentos concluídos: ${b.atendimentos}`, margemEsquerda, y);
        doc.text(`Comissão total: ${formatarReais(b.comissaoCentavos)}`, margemEsquerda + 95, y);
        y += 9;

        // Produtos
        const taxaProdutos = taxaConversao(b.qtdProdutos, b.atendimentos);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Produtos vendidos: ${b.qtdProdutos} — ${taxaProdutos.label}`, margemEsquerda, y);
        y += 5;
        barraConversao(y, taxaProdutos.percentual);
        y += 8;
        doc.setTextColor(0, 0, 0);
        for (const p of b.produtos) {
          y = espacoOuNovaPagina(y, 20);
          const t = taxaConversao(p.qtd, b.atendimentos);
          doc.setFontSize(9);
          doc.text(`- ${p.nome}: ${p.qtd} (${t.label})`, margemEsquerda + 4, y);
          y += 5;
        }
        if (b.produtos.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(140, 140, 140);
          doc.text("- nenhum produto vendido no período", margemEsquerda + 4, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        y += 4;

        // Serviços extras
        y = espacoOuNovaPagina(y, 30);
        const taxaExtras = taxaConversao(b.qtdExtras, b.atendimentos);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Serviços extras vendidos: ${b.qtdExtras} — ${taxaExtras.label}`, margemEsquerda, y);
        y += 5;
        barraConversao(y, taxaExtras.percentual);
        y += 8;
        doc.setTextColor(0, 0, 0);
        for (const e of b.extras) {
          y = espacoOuNovaPagina(y, 24);
          const t = taxaConversao(e.qtd, b.atendimentos);
          doc.setFontSize(9);
          doc.text(`- ${e.nome}: ${e.qtd} (${t.label})`, margemEsquerda + 4, y);
          y += 5;
          barraConversao(y, t.percentual);
          y += 7;
        }
        if (b.extras.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(140, 140, 140);
          doc.text("- nenhum serviço extra vendido no período", margemEsquerda + 4, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }

        y += 12;
      }
      if (barbeiros.length === 0) {
        doc.setFontSize(10);
        doc.text("Nenhum atendimento no período.", margemEsquerda, y);
      }

      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, margemEsquerda, alturaPagina - 12);

      doc.save(`relatorio-detalhado-barbeiros-${new Date().toISOString().slice(0, 10)}.pdf`);
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
      {gerandoPdf ? "Gerando..." : "📊 Baixar relatório detalhado por barbeiro"}
    </button>
  );
}
