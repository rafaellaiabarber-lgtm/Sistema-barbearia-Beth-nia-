import type { MetadataRoute } from "next";

// Permite instalar o sistema como app no celular ("Adicionar à tela inicial"),
// abrindo direto no cronômetro de corte, em tela cheia, sem a barra do navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cronômetro de Corte",
    short_name: "Cronômetro",
    description: "Cronometre cada etapa do corte, acompanhe sua evolução e complete desafios.",
    start_url: "/cronometro",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
