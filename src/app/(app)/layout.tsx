import Link from "next/link";
import { CircleUser, ShieldCheck } from "lucide-react";
import { requireUsuario } from "@/lib/session";
import { BarraInferior, TituloPagina } from "./navegacao";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const eu = await requireUsuario();

  return (
    <div className="flex-1 flex flex-col">
      <header
        className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-900"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-xl mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <TituloPagina />
          </div>
          {eu.papel === "INSTRUTOR" && (
            <Link
              href="/instrutor"
              className="flex items-center gap-1 rounded-full border border-orange-500/50 text-orange-300 text-xs font-semibold px-3 py-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Instrutor
            </Link>
          )}
          <Link href="/conta" aria-label="Minha conta" className="text-neutral-400 hover:text-white">
            <CircleUser className="w-7 h-7" />
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 pb-nav">{children}</main>
      <BarraInferior />
    </div>
  );
}
