export type TipoMaterial = "TEXTO" | "LINK" | "VIDEO" | "ARQUIVO";

export const LABEL_TIPO_MATERIAL: Record<TipoMaterial, string> = {
  TEXTO: "Texto",
  LINK: "Link (planilha, PDF, etc.)",
  VIDEO: "Vídeo (YouTube ou Google Drive)",
  ARQUIVO: "Arquivo pra baixar (planilha, PDF, etc.)",
};

export function urlEmbedVideo(url: string): string | null {
  const trimmed = url.trim();

  const youtube = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}`;
  }

  const drive = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drive) {
    return `https://drive.google.com/file/d/${drive[1]}/preview`;
  }

  return null;
}
