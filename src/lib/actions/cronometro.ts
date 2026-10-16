"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/session";
import { ETAPAS, MODELOS_DESAFIOS, MODELOS_TECNICAS, type EtapaCorte } from "@/lib/cronometro";
import type { FormState } from "./auth";

const MAXIMO_SEGUNDOS_ETAPA = 4 * 60 * 60;
const MINIMO_SEGUNDOS_CORTE = 60;

function revalidarTudo() {
  revalidatePath("/", "layout");
}

export type SalvarCorteInput = {
  tecnicaId: string;
  iniciadoEm: number;
  segundos: Record<EtapaCorte, number>;
};

export type SalvarCorteResultado = {
  erro?: string;
  sucesso?: boolean;
  segundosTotal?: number;
  recorde?: boolean;
  // Média dos cortes anteriores dessa técnica (pra mostrar "X min mais rápido que sua média").
  mediaAnterior?: number | null;
};

export async function salvarRegistroCorte(input: SalvarCorteInput): Promise<SalvarCorteResultado> {
  const eu = await requireUsuario();

  const segundos = {} as Record<EtapaCorte, number>;
  for (const etapa of ETAPAS) {
    const valor = Math.round(Number(input.segundos?.[etapa]));
    if (!Number.isFinite(valor) || valor < 0 || valor > MAXIMO_SEGUNDOS_ETAPA) {
      return { erro: "Tempo inválido em uma das etapas." };
    }
    segundos[etapa] = valor;
  }
  const segundosTotal = ETAPAS.reduce((soma, e) => soma + segundos[e], 0);
  if (segundosTotal < MINIMO_SEGUNDOS_CORTE) {
    return { erro: "O corte precisa ter pelo menos 1 minuto pra ser registrado." };
  }

  const tecnica = await prisma.tecnicaCorte.findUnique({ where: { id: String(input.tecnicaId) } });
  if (!tecnica) return { erro: "Técnica não encontrada." };

  const agora = new Date();
  const iniciadoEm = new Date(input.iniciadoEm);
  // Aceita o início informado pelo aparelho só se for coerente; senão, deduz pelo tempo total.
  const inicioValido =
    Number.isFinite(iniciadoEm.getTime()) &&
    iniciadoEm.getTime() <= agora.getTime() &&
    agora.getTime() - iniciadoEm.getTime() < 24 * 60 * 60 * 1000;

  const anteriores = await prisma.registroCorte.findMany({
    where: { usuarioId: eu.id, tecnicaId: tecnica.id },
    select: { segundosTotal: true },
  });

  await prisma.registroCorte.create({
    data: {
      usuarioId: eu.id,
      tecnicaId: tecnica.id,
      tecnicaNomeSnapshot: tecnica.nome,
      segundosMaquina: segundos.MAQUINA,
      segundosTransicao: segundos.TRANSICAO,
      segundosAcabamento: segundos.ACABAMENTO,
      segundosFinalizacao: segundos.FINALIZACAO,
      segundosTotal,
      iniciadoEm: inicioValido ? iniciadoEm : new Date(agora.getTime() - segundosTotal * 1000),
      concluidoEm: agora,
    },
  });

  revalidarTudo();
  const mediaAnterior =
    anteriores.length > 0 ? anteriores.reduce((s, r) => s + r.segundosTotal, 0) / anteriores.length : null;
  const recorde = anteriores.length > 0 && anteriores.every((r) => segundosTotal < r.segundosTotal);
  return { sucesso: true, segundosTotal, recorde, mediaAnterior };
}

export async function excluirRegistroCorte(id: string) {
  const eu = await requireUsuario();
  // Aluno só apaga os próprios cortes; o instrutor pode apagar qualquer um.
  await prisma.registroCorte.deleteMany({
    where: { id, ...(eu.papel === "INSTRUTOR" ? {} : { usuarioId: eu.id }) },
  });
  revalidarTudo();
}

// ---------- Instrutor: técnicas, checklist e desafios ----------

export async function criarTecnica(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUsuario("INSTRUTOR");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome da técnica." };

  const ultima = await prisma.tecnicaCorte.findFirst({ orderBy: { ordem: "desc" } });
  await prisma.tecnicaCorte.create({ data: { nome, ordem: (ultima?.ordem ?? -1) + 1 } });
  revalidarTudo();
  return { sucesso: true };
}

export async function renomearTecnica(id: string, nome: string) {
  await requireUsuario("INSTRUTOR");
  const limpo = nome.trim();
  if (!limpo) return;
  await prisma.tecnicaCorte.updateMany({ where: { id }, data: { nome: limpo } });
  revalidarTudo();
}

export async function alternarTecnicaAtiva(id: string, ativo: boolean) {
  await requireUsuario("INSTRUTOR");
  await prisma.tecnicaCorte.updateMany({ where: { id }, data: { ativo } });
  revalidarTudo();
}

export async function excluirTecnica(id: string) {
  await requireUsuario("INSTRUTOR");
  // Os cortes já registrados continuam (com o nome guardado em tecnicaNomeSnapshot).
  await prisma.tecnicaCorte.deleteMany({ where: { id } });
  revalidarTudo();
}

export async function adicionarPasso(tecnicaId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUsuario("INSTRUTOR");
  const texto = String(formData.get("texto") ?? "").trim();
  const etapa = String(formData.get("etapa") ?? "") as EtapaCorte;
  if (!texto) return { erro: "Escreva o passo." };
  if (!ETAPAS.includes(etapa)) return { erro: "Etapa inválida." };
  if (!(await prisma.tecnicaCorte.findUnique({ where: { id: tecnicaId } }))) return { erro: "Técnica não encontrada." };

  const ultimo = await prisma.passoTecnicaCorte.findFirst({ where: { tecnicaId, etapa }, orderBy: { ordem: "desc" } });
  await prisma.passoTecnicaCorte.create({ data: { tecnicaId, etapa, texto, ordem: (ultimo?.ordem ?? -1) + 1 } });
  revalidarTudo();
  return { sucesso: true };
}

export async function excluirPasso(id: string) {
  await requireUsuario("INSTRUTOR");
  await prisma.passoTecnicaCorte.deleteMany({ where: { id } });
  revalidarTudo();
}

export async function moverPasso(id: string, direcao: "cima" | "baixo") {
  await requireUsuario("INSTRUTOR");
  const passo = await prisma.passoTecnicaCorte.findUnique({ where: { id } });
  if (!passo) return;

  const passos = await prisma.passoTecnicaCorte.findMany({
    where: { tecnicaId: passo.tecnicaId, etapa: passo.etapa },
    orderBy: { ordem: "asc" },
  });
  const index = passos.findIndex((p) => p.id === id);
  const alvo = direcao === "cima" ? index - 1 : index + 1;
  if (alvo < 0 || alvo >= passos.length) return;

  // Reescreve a ordem inteira (0..n) pra não depender de valores de ordem únicos.
  const reordenados = [...passos];
  [reordenados[index], reordenados[alvo]] = [reordenados[alvo], reordenados[index]];
  await prisma.$transaction(
    reordenados.map((p, i) => prisma.passoTecnicaCorte.update({ where: { id: p.id }, data: { ordem: i } }))
  );
  revalidarTudo();
}

export async function criarDesafio(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUsuario("INSTRUTOR");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tecnicaId = String(formData.get("tecnicaId") ?? "") || null;
  const metaMinutos = Math.round(Number(formData.get("metaMinutos")));
  const diasSeguidos = Math.round(Number(formData.get("diasSeguidos")));

  if (!titulo) return { erro: "Informe o nome do desafio." };
  if (!Number.isFinite(metaMinutos) || metaMinutos < 1 || metaMinutos > 240) return { erro: "Meta de minutos inválida." };
  if (!Number.isFinite(diasSeguidos) || diasSeguidos < 1 || diasSeguidos > 90) return { erro: "Quantidade de dias inválida." };
  if (tecnicaId && !(await prisma.tecnicaCorte.findUnique({ where: { id: tecnicaId } }))) {
    return { erro: "Técnica não encontrada." };
  }

  await prisma.desafioCorte.create({ data: { titulo, tecnicaId, metaMinutos, diasSeguidos } });
  revalidarTudo();
  return { sucesso: true };
}

export async function alternarDesafioAtivo(id: string, ativo: boolean) {
  await requireUsuario("INSTRUTOR");
  await prisma.desafioCorte.updateMany({ where: { id }, data: { ativo } });
  revalidarTudo();
}

export async function excluirDesafio(id: string) {
  await requireUsuario("INSTRUTOR");
  await prisma.desafioCorte.deleteMany({ where: { id } });
  revalidarTudo();
}

/** Cria Low/Mid/High Fade com checklist e alguns desafios, pulando o que já existir pelo nome. */
export async function criarModelosProntos() {
  await requireUsuario("INSTRUTOR");

  const existentes = await prisma.tecnicaCorte.findMany();
  const porNome = new Map(existentes.map((t) => [t.nome.toLowerCase(), t]));
  let ordem = existentes.reduce((max, t) => Math.max(max, t.ordem), -1) + 1;

  for (const modelo of MODELOS_TECNICAS) {
    if (porNome.has(modelo.nome.toLowerCase())) continue;
    const ordemPorEtapa: Partial<Record<EtapaCorte, number>> = {};
    const tecnica = await prisma.tecnicaCorte.create({
      data: {
        nome: modelo.nome,
        ordem: ordem++,
        passos: {
          create: modelo.passos.map((p) => {
            const o = ordemPorEtapa[p.etapa] ?? 0;
            ordemPorEtapa[p.etapa] = o + 1;
            return { etapa: p.etapa, texto: p.texto, ordem: o };
          }),
        },
      },
    });
    porNome.set(modelo.nome.toLowerCase(), tecnica);
  }

  const titulos = new Set((await prisma.desafioCorte.findMany({ select: { titulo: true } })).map((d) => d.titulo.toLowerCase()));
  for (const d of MODELOS_DESAFIOS) {
    if (titulos.has(d.titulo.toLowerCase())) continue;
    await prisma.desafioCorte.create({
      data: {
        titulo: d.titulo,
        tecnicaId: d.tecnica ? (porNome.get(d.tecnica.toLowerCase())?.id ?? null) : null,
        metaMinutos: d.metaMinutos,
        diasSeguidos: d.diasSeguidos,
      },
    });
  }

  revalidarTudo();
}
