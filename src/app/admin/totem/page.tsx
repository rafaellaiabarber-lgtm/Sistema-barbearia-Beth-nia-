import { obterConfiguracaoTotem } from "@/lib/actions/totem";
import { LogoTotemForm } from "./logo-totem-form";
import { FundoTotemForm } from "./fundo-totem-form";

export default async function TotemConfigPage() {
  const configuracao = await obterConfiguracaoTotem();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Personalizar totem</h1>
      <p className="text-slate-500 text-sm mb-6">
        Defina a logo e a imagem de fundo exibidas na tela de autoatendimento (totem).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <LogoTotemForm logoUrl={configuracao?.logoUrl ?? null} />
        <FundoTotemForm fundoUrl={configuracao?.fundoUrl ?? null} fundoTipo={configuracao?.fundoTipo ?? null} />
      </div>
    </div>
  );
}
