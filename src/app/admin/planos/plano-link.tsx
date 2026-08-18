import QRCode from "qrcode";
import { CopiarLinkButton } from "./copiar-link-button";

export async function PlanoLink({ planoId, baseUrl }: { planoId: string; baseUrl: string }) {
  const url = `${baseUrl}/assinar/${planoId}`;
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
          <p className="text-slate-500 dark:text-slate-400 text-sm break-all max-w-xs">{url}</p>
          <CopiarLinkButton url={url} />
        </div>
      </div>
    </details>
  );
}
