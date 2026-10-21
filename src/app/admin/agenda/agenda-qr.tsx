import QRCode from "qrcode";

export async function AgendaQr({ baseUrl, barbeariaSlug }: { baseUrl: string; barbeariaSlug: string }) {
  const url = `${baseUrl}/${barbeariaSlug}/agendar`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 180 });

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col items-center text-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR Code da agenda" className="w-36 h-36" />
      <p className="font-semibold text-neutral-900 dark:text-white">Link de agendamento</p>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs break-all">{url}</p>
    </div>
  );
}
