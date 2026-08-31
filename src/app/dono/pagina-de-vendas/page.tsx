import Link from "next/link";
import { requireDonoPlataforma } from "@/lib/tenant";
import {
  obterConfiguracaoPlataforma,
  atualizarFotoHero,
  removerFotoHero,
  atualizarFotoGaleria1,
  removerFotoGaleria1,
  atualizarFotoGaleria2,
  removerFotoGaleria2,
  atualizarFotoGaleria3,
  removerFotoGaleria3,
} from "@/lib/actions/plataforma";
import { ImagemTotemForm } from "../../admin/totem/imagem-totem-form";

export default async function PaginaDeVendasConfigPage() {
  await requireDonoPlataforma();
  const configuracao = await obterConfiguracaoPlataforma();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dono" className="text-sm text-neutral-500 hover:text-orange-600 mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Página de vendas</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          Fotos exibidas na página inicial pública (o link que você manda pra quem tem interesse em cadastrar a
          barbearia). O texto e os recursos mostrados na página já estão prontos — aqui você só troca as fotos.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImagemTotemForm
            campo="fotoHeroUrl"
            label="Foto principal"
            descricao="A foto de destaque, no topo da página."
            imagemUrl={configuracao?.fotoHeroUrl ?? null}
            aspecto="fundo"
            acao={atualizarFotoHero}
            acaoRemover={removerFotoHero}
          />
          <ImagemTotemForm
            campo="fotoGaleria1Url"
            label="Foto 1"
            descricao="Foto da sua barbearia, equipe ou do sistema em uso."
            imagemUrl={configuracao?.fotoGaleria1Url ?? null}
            aspecto="fundo"
            acao={atualizarFotoGaleria1}
            acaoRemover={removerFotoGaleria1}
          />
          <ImagemTotemForm
            campo="fotoGaleria2Url"
            label="Foto 2"
            descricao="Foto da sua barbearia, equipe ou do sistema em uso."
            imagemUrl={configuracao?.fotoGaleria2Url ?? null}
            aspecto="fundo"
            acao={atualizarFotoGaleria2}
            acaoRemover={removerFotoGaleria2}
          />
          <ImagemTotemForm
            campo="fotoGaleria3Url"
            label="Foto 3"
            descricao="Foto da sua barbearia, equipe ou do sistema em uso."
            imagemUrl={configuracao?.fotoGaleria3Url ?? null}
            aspecto="fundo"
            acao={atualizarFotoGaleria3}
            acaoRemover={removerFotoGaleria3}
          />
        </div>
      </div>
    </div>
  );
}
