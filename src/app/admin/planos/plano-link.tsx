import QRCode from "qrcode";
import type { Plano } from "@prisma/client";
import { CopiarLinkButton } from "../../copiar-link-button";
import { LinkExternoForm } from "./link-externo-form";

export async function PlanoLink({ plano, editavel = false }: { plano: Plano; editavel?: boolean }) {
  const url = plano.linkExterno;
  const dataUrl = url ? await QRCode.toDataURL(url, { margin: 1, width: 160 }) : null;

  return (
    <details>
      <summary className="cursor-pointer text-sm text-orange-600 dark:text-orange-400 hover:underline select-none">
        QR Code pra assinar esse plano
      </summary>
      <div className="mt-3">
        {dataUrl && url ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR Code pra assinar" className="w-32 h-32 rounded-lg border border-neutral-200 dark:border-neutral-800" />
            <div className="flex flex-col gap-2">
              <p className="text-neutral-500 dark:text-neutral-400 text-sm break-all max-w-xs">{url}</p>
              <CopiarLinkButton url={url} />
            </div>
          </div>
        ) : (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm">
            {editavel ? "Nenhum link cadastrado ainda — cole um link abaixo pra gerar o QR Code." : "Nenhum link cadastrado ainda."}
          </p>
        )}
      </div>
      {editavel && (
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <LinkExternoForm planoId={plano.id} linkAtual={plano.linkExterno} />
        </div>
      )}
    </details>
  );
}
