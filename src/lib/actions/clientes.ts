"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { normalizarTelefone } from "@/lib/format";

export type ClienteState = { erro?: string; sucesso?: boolean };

export async function criarCliente(_prevState: ClienteState, formData: FormData): Promise<ClienteState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefoneRaw = String(formData.get("telefone") ?? "").trim();
  const telefone = telefoneRaw ? normalizarTelefone(telefoneRaw) : null;

  if (!nome) return { erro: "Informe o nome do cliente." };

  if (telefone) {
    const existente = await prisma.cliente.findUnique({ where: { telefone } });
    if (existente) return { erro: "Já existe um cliente cadastrado com esse telefone." };
  }

  await prisma.cliente.create({ data: { nome, telefone } });

  revalidatePath("/admin/clientes");
  return { sucesso: true };
}
