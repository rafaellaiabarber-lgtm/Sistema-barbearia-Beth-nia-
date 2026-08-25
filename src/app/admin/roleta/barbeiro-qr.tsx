import QRCode from "qrcode";

export async function BarbeiroQr({ barbeiroId, nome, baseUrl }: { barbeiroId: string; nome: string; baseUrl: string }) {
  const url = `${baseUrl}/roleta/${barbeiroId}`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 160 });

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col items-center text-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR Code da roleta de ${nome}`} className="w-32 h-32" />
      <p className="font-semibold text-neutral-900 dark:text-white">{nome}</p>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs break-all">{url}</p>
    </div>
  );
}
