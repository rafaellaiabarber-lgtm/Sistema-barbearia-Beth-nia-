"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ConfiguracaoAvaliacaoState = { erro?: string };

export async function salvarLinkAvaliacaoGoogle(
  _prevState: ConfiguracaoAvaliacaoState,
  formData: FormData
): Promise<ConfiguracaoAvaliacaoState> {
  const session = await requireSession(["ADMIN"]);

  const link = String(formData.get("linkGoogle") ?? "").trim();
  if (link && !/^https?:\/\//i.test(link)) {
    return { erro: "O link precisa começar com http:// ou https://" };
  }

  await prisma.configuracaoAvaliacao.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, linkGoogle: link || null },
    update: { linkGoogle: link || null },
  });

  revalidatePath("/admin/pedir-avaliacao");
  return {};
}
