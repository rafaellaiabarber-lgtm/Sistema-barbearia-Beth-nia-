import { sair } from "@/lib/actions/auth";
import { requireUsuario } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CARTAO } from "@/components/ui";
import { TrocarSenhaForm } from "./trocar-senha-form";

export default async function ContaPage() {
  const eu = await requireUsuario();
  const [usuario, totalCortes] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { id: eu.id }, select: { login: true, criadoEm: true } }),
    prisma.registroCorte.count({ where: { usuarioId: eu.id } }),
  ]);

  return (
    <div className="space-y-4">
      <div className={CARTAO}>
        <p className="text-lg font-bold">{eu.nome}</p>
        <p className="text-sm text-neutral-400">{usuario.login}</p>
        <p className="text-sm text-neutral-400 mt-2">
          {totalCortes} {totalCortes === 1 ? "corte cronometrado" : "cortes cronometrados"} desde{" "}
          {usuario.criadoEm.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-1">Instalar no celular</p>
        <p className="text-sm text-neutral-400">
          <strong className="text-neutral-200">iPhone:</strong> no Safari, toque em Compartilhar → “Adicionar à Tela de
          Início”.
          <br />
          <strong className="text-neutral-200">Android:</strong> no Chrome, toque nos 3 pontinhos → “Instalar app” ou
          “Adicionar à tela inicial”.
        </p>
      </div>

      <div className={CARTAO}>
        <p className="font-semibold mb-3">Trocar senha</p>
        <TrocarSenhaForm />
      </div>

      <form action={sair}>
        <button className="w-full rounded-xl border border-neutral-700 py-3 font-semibold text-neutral-300">Sair</button>
      </form>
    </div>
  );
}
