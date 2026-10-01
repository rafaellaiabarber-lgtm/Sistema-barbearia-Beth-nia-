"use client";

import { useState } from "react";
import { formatarReais } from "@/lib/format";

type ItemComparativo = {
  nome: string;
  qtd: number;
  taxaEquipePercentual: number;
  oportunidadeCentavos: number;
};

type BarbeiroDetalhado = {
  nome: string;
  atendimentos: number;
  comissaoCentavos: number;
  qtdProdutos: number;
  produtos: ItemComparativo[];
  qtdExtras: number;
  extras: ItemComparativo[];
};

function taxaBarbeiro(qtd: number, atendimentos: number) {
  if (atendimentos <= 0) return 0;
  return (qtd / atendimentos) * 100;
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
      const larguraBarra = 70;
      const alturaPagina = doc.internal.pageSize.getHeight();

      function cabecalho() {
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
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

      function duasBarras(y: number, pctBarbeiro: number, pctEquipe: number) {
        doc.setFillColor(230, 230, 230);
        doc.rect(margemEsquerda, y, larguraBarra, 3, "F");
        doc.setFillColor(234, 88, 12);
        doc.rect(margemEsquerda, y, (larguraBarra * Math.max(0, Math.min(100, pctBarbeiro))) / 100, 3, "F");
        // Marcador da média da equipe, pra comparar visualmente com a barra do barbeiro.
        const xMarcador = margemEsquerda + (larguraBarra * Math.max(0, Math.min(100, pctEquipe))) / 100;
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(0.6);
        doc.line(xMarcador, y - 1, xMarcador, y + 4);
      }

      function linhaItem(y: number, atendimentos: number, item: ItemComparativo) {
        const pctBarbeiro = taxaBarbeiro(item.qtd, atendimentos);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`- ${item.nome}: ${item.qtd} (${pctBarbeiro.toFixed(0)}%)`, margemEsquerda + 4, y);
        doc.setTextColor(100, 100, 100);
        doc.text(`média equipe: ${item.taxaEquipePercentual.toFixed(0)}%`, margemEsquerda + 100, y);
        y += 4.5;
        duasBarras(y, pctBarbeiro, item.taxaEquipePercentual);
        y += 5.5;
        if (item.oportunidadeCentavos > 0) {
          doc.setFontSize(8);
          doc.setTextColor(180, 60, 0);
          doc.text(
            `Se vendesse no ritmo da equipe: +${formatarReais(item.oportunidadeCentavos)} de comissão no período`,
            margemEsquerda + 4,
            y
          );
          y += 5;
        }
        doc.setTextColor(0, 0, 0);
        return y;
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
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Produtos vendidos: ${b.qtdProdutos}`, margemEsquerda, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
        for (const p of b.produtos) {
          y = espacoOuNovaPagina(y, 26);
          y = linhaItem(y, b.atendimentos, p);
        }
        if (b.produtos.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(140, 140, 140);
          doc.text("- nenhum produto vendido no período (pela barbearia toda)", margemEsquerda + 4, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        y += 4;

        // Serviços extras
        y = espacoOuNovaPagina(y, 30);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Serviços extras vendidos: ${b.qtdExtras}`, margemEsquerda, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
        for (const e of b.extras) {
          y = espacoOuNovaPagina(y, 26);
          y = linhaItem(y, b.atendimentos, e);
        }
        if (b.extras.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(140, 140, 140);
          doc.text("- nenhum serviço extra vendido no período (pela barbearia toda)", margemEsquerda + 4, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }

        y += 12;
      }
      if (barbeiros.length === 0) {
        doc.setFontSize(10);
        doc.text("Nenhum atendimento no período.", margemEsquerda, y);
      }

      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      const notaFinal =
        "Legenda: a barra laranja é o quanto o barbeiro vendeu (em % dos atendimentos dele); o tracinho preto marca a média da equipe no mesmo período. \"Se vendesse no ritmo da equipe\" é uma estimativa (preço do item × comissão aplicável), não um valor já pago.";
      const linhasNota = doc.splitTextToSize(notaFinal, 170);
      doc.text(linhasNota, margemEsquerda, alturaPagina - 20);

      doc.setFontSize(9);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, margemEsquerda, alturaPagina - 8);

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
