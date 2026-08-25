"use client";

import { useMemo, useState } from "react";
import { reaisParaCentavos, formatarReais } from "@/lib/format";

export function CalculadoraComissaoCombinada({
  barbeiroNome,
  servicoNome,
  periodoLabel,
  quantidade,
  comissaoAtualCentavos,
}: {
  barbeiroNome: string;
  servicoNome: string;
  periodoLabel: string;
  quantidade: number;
  comissaoAtualCentavos: number;
}) {
  const [valorCombinado, setValorCombinado] = useState("");
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const valorCombinadoCentavos = reaisParaCentavos(valorCombinado || "0");
  const mediaCentavos = quantidade > 0 ? Math.round(valorCombinadoCentavos / quantidade) : 0;

  const podeExportar = valorCombinado.trim() !== "" && quantidade > 0;

  async function exportarPdf() {
    setGerandoPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Barbearia Bethânia", 20, 20);
      doc.setFontSize(12);
      doc.text("Comissão combinada", 20, 30);

      doc.setFontSize(11);
      const linhas = [
        `Barbeiro: ${barbeiroNome}`,
        `Serviço: ${servicoNome}`,
        `Período: ${periodoLabel}`,
        "",
        `Quantidade de atendimentos: ${quantidade}`,
        `Comissão total combinada: ${formatarReais(valorCombinadoCentavos)}`,
        `Média por atendimento: ${formatarReais(mediaCentavos)}`,
      ];
      let y = 45;
      for (const linha of linhas) {
        doc.text(linha, 20, y);
        y += 8;
      }

      doc.setFontSize(9);
      doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 20, y + 10);

      doc.save(`comissao-combinada-${barbeiroNome.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-8">
      <h2 className="font-semibold mb-1">Calcular comissão combinada</h2>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
        {barbeiroNome} fez {quantidade} atendimento(s) de {servicoNome} em {periodoLabel} — comissão automática hoje:{" "}
        {formatarReais(comissaoAtualCentavos)}. Se quiser combinar um valor total diferente pra esses atendimentos
        (sem mudar nada no sistema), digite abaixo.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Comissão total combinada (R$)
          </label>
          <input
            value={valorCombinado}
            onChange={(e) => setValorCombinado(e.target.value)}
            placeholder={(comissaoAtualCentavos / 100).toFixed(2).replace(".", ",")}
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-32"
          />
        </div>
        <button
          type="button"
          onClick={exportarPdf}
          disabled={!podeExportar || gerandoPdf}
          className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-4 py-2 text-sm"
        >
          {gerandoPdf ? "Gerando..." : "Exportar PDF"}
        </button>
      </div>

      {valorCombinado.trim() !== "" && (
        <p className="text-sm">
          Média por atendimento:{" "}
          <span className="font-semibold text-orange-600 dark:text-orange-400">{formatarReais(mediaCentavos)}</span>
        </p>
      )}
    </div>
  );
}
