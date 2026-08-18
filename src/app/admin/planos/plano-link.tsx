import QRCode from "qrcode";
import type { Plano } from "@prisma/client";
import { linkPlano } from "@/lib/assinaturas";
import { CopiarLinkButton } from "../../copiar-link-button";
import { LinkExternoForm } from "./link-externo-form";

export async function PlanoLink({
  plano,
  baseUrl,
  editavel = false,
}: {
  plano: Plano;
  baseUrl: string;
  editavel?: boolean;
}) {
  const url = linkPlano(plano, baseUrl);
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 160 });

  return (
    <details>
      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline select-none">
        Link e QR Code pra assinar esse plano
      </summary>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`QR Code pra assinar`} className="w-32 h-32 rounded-lg border border-slate-200 dark:border-slate-800" />
        <div className="flex flex-col gap-2">
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            {plano.linkExterno ? "Usando o link externo cadastrado abaixo." : "Sem link externo cadastrado — usando a página interna de assinatura."}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm break-all max-w-xs">{url}</p>
          <CopiarLinkButton url={url} />
        </div>
      </div>
      {editavel && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <LinkExternoForm planoId={plano.id} linkAtual={plano.linkExterno} />
        </div>
      )}
    </details>
  );
}
