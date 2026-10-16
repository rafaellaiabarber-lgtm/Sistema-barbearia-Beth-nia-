import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barbearia Bethânia",
  description: "Sistema de fila, clientes e financeiro da Barbearia Bethânia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          // Roda antes da hidratação pra evitar o "flash" da tela clara. Escuro é o padrão agora;
          // só fica claro se a pessoa escolheu isso explicitamente antes (salvo em localStorage).
          dangerouslySetInnerHTML={{
            __html: `try {
              var tema = localStorage.getItem('tema');
              if (tema !== 'claro') {
                document.documentElement.classList.add('dark');
              }
              if (localStorage.getItem('valoresOcultos') === 'sim') {
                document.documentElement.classList.add('ocultar-valores');
              }
            } catch (e) {}`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
