import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuario } from "@/lib/session";

export default async function Inicio() {
  if (await getUsuario()) redirect("/cronometro");
  if ((await prisma.usuario.count()) === 0) redirect("/primeiro-acesso");
  redirect("/entrar");
}
