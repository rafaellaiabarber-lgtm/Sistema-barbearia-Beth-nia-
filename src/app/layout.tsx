import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbearia Beth Nia",
  description: "Sistema de fila, clientes e financeiro da Barbearia Beth Nia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
