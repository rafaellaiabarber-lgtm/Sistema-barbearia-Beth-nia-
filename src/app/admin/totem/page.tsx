import {
  obterConfiguracaoTotem,
  atualizarLogoTotem,
  atualizarLogoMenu,
  atualizarFundoTotem,
  removerLogoTotem,
  removerLogoMenu,
  removerFundoTotem,
} from "@/lib/actions/totem";
import { ImagemTotemForm } from "./imagem-totem-form";

export default async function TotemConfigPage() {
  const configuracao = await obterConfiguracaoTotem();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Personalizar totem</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Defina as logos e a imagem de fundo usadas no sistema.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagemTotemForm
          campo="logo"
          label="Logo do totem"
          descricao="Exibida no topo da tela do totem, no lugar do nome da barbearia."
          imagemUrl={configuracao?.logoUrl ?? null}
          aspecto="logo"
          acao={atualizarLogoTotem}
          acaoRemover={removerLogoTotem}
        />
        <ImagemTotemForm
          campo="logoMenu"
          label="Logo do menu e login"
          descricao="Exibida no menu lateral e na tela de login. Se não definida, usa a mesma logo do totem."
          imagemUrl={configuracao?.logoMenuUrl ?? null}
          aspecto="logo"
          acao={atualizarLogoMenu}
          acaoRemover={removerLogoMenu}
        />
        <ImagemTotemForm
          campo="fundo"
          label="Imagem de fundo"
          descricao="Exibida atrás da tela do totem."
          imagemUrl={configuracao?.fundoUrl ?? null}
          aspecto="fundo"
          acao={atualizarFundoTotem}
          acaoRemover={removerFundoTotem}
        />
      </div>
    </div>
  );
}
