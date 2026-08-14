import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { urlEmbedVideo } from "@/lib/treinamento";

export default async function TreinamentoPage() {
  await requireSession(["ADMIN", "BARBEIRO"]);

  const materiais = await prisma.materialTreinamento.findMany({ orderBy: { ordem: "asc" } });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Treinamento</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Cronograma, POP e vídeo-aulas da barbearia.
        </p>
      </header>

      <div className="space-y-4">
        {materiais.map((m) => (
          <div
            key={m.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
          >
            <p className="font-semibold mb-2">{m.titulo}</p>
            {m.tipo === "TEXTO" && (
              <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">{m.conteudo}</p>
            )}
            {m.tipo === "LINK" && (
              <a
                href={m.conteudo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Abrir material →
              </a>
            )}
            {m.tipo === "ARQUIVO" && (
              <a
                href={m.conteudo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Baixar arquivo →
              </a>
            )}
            {m.tipo === "VIDEO" &&
              (urlEmbedVideo(m.conteudo) ? (
                <div className="aspect-video w-full max-w-xl">
                  <iframe
                    src={urlEmbedVideo(m.conteudo)!}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  />
                </div>
              ) : (
                <a
                  href={m.conteudo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Assistir vídeo →
                </a>
              ))}
          </div>
        ))}
        {materiais.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500">Nenhum material de treinamento por aqui ainda.</p>
        )}
      </div>
    </div>
  );
}
