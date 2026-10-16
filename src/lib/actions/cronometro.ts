"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ETAPAS, MODELOS_DESAFIOS, MODELOS_TECNICAS, type EtapaCorte } from "@/lib/cronometro";

const ERRO_BANCO = "Não foi possível salvar. Fale com o suporte técnico — pode faltar rodar uma atualização no banco.";
const MAXIMO_SEGUNDOS_ETAPA = 4 * 60 * 60;
const MINIMO_SEGUNDOS_CORTE = 60;

function revalidarCronometro() {
  revalidatePath("/cronometro", "layout");
  revalidatePath("/admin/cronometro");
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
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (!session.barbeiroId) {
    return { erro: "Seu usuário não está vinculado a um barbeiro, então não dá pra registrar cortes." };
  }

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

  const iniciadoEm = new Date(input.iniciadoEm);
  const agora = new Date();
  // Aceita o início informado pelo aparelho só se for coerente; senão, deduz pelo tempo total.
  const inicioValido =
    Number.isFinite(iniciadoEm.getTime()) &&
    iniciadoEm.getTime() <= agora.getTime() &&
    agora.getTime() - iniciadoEm.getTime() < 24 * 60 * 60 * 1000;

  try {
    const tecnica = await prisma.tecnicaCorte.findFirst({
      where: { id: input.tecnicaId, barbeariaId: session.barbeariaId },
    });
    if (!tecnica) return { erro: "Técnica não encontrada." };

    const anteriores = await prisma.registroCorte.findMany({
      where: { barbeariaId: session.barbeariaId, barbeiroId: session.barbeiroId, tecnicaId: tecnica.id },
      select: { segundosTotal: true },
    });

    await prisma.registroCorte.create({
      data: {
        barbeariaId: session.barbeariaId,
        barbeiroId: session.barbeiroId,
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

    revalidarCronometro();
    const mediaAnterior =
      anteriores.length > 0 ? anteriores.reduce((s, r) => s + r.segundosTotal, 0) / anteriores.length : null;
    const recorde = anteriores.length > 0 && anteriores.every((r) => segundosTotal < r.segundosTotal);
    return { sucesso: true, segundosTotal, recorde, mediaAnterior };
  } catch {
    return { erro: ERRO_BANCO };
  }
}

export async function excluirRegistroCorte(id: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  // Barbeiro só apaga os próprios cortes; o admin pode apagar qualquer um da barbearia.
  await prisma.registroCorte.deleteMany({
    where: {
      id,
      barbeariaId: session.barbeariaId,
      ...(session.role === "ADMIN" ? {} : { barbeiroId: session.barbeiroId ?? "__nenhum__" }),
    },
  });
  revalidarCronometro();
}

// ---------- Admin: técnicas, checklist e desafios ----------

export type CronometroAdminState = { erro?: string; sucesso?: boolean };

export async function criarTecnica(_prev: CronometroAdminState, formData: FormData): Promise<CronometroAdminState> {
  const session = await requireSession(["ADMIN"]);
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome da técnica." };

  try {
    const ultima = await prisma.tecnicaCorte.findFirst({
      where: { barbeariaId: session.barbeariaId },
      orderBy: { ordem: "desc" },
    });
    await prisma.tecnicaCorte.create({
      data: { barbeariaId: session.barbeariaId, nome, ordem: (ultima?.ordem ?? -1) + 1 },
    });
  } catch {
    return { erro: ERRO_BANCO };
  }
  revalidarCronometro();
  return { sucesso: true };
}

export async function renomearTecnica(id: string, nome: string) {
  const session = await requireSession(["ADMIN"]);
  const limpo = nome.trim();
  if (!limpo) return;
  await prisma.tecnicaCorte.updateMany({ where: { id, barbeariaId: session.barbeariaId }, data: { nome: limpo } });
  revalidarCronometro();
}

export async function alternarTecnicaAtiva(id: string, ativo: boolean) {
  const session = await requireSession(["ADMIN"]);
  await prisma.tecnicaCorte.updateMany({ where: { id, barbeariaId: session.barbeariaId }, data: { ativo } });
  revalidarCronometro();
}

export async function excluirTecnica(id: string) {
  const session = await requireSession(["ADMIN"]);
  // Os cortes já registrados continuam (com o nome guardado em tecnicaNomeSnapshot).
  await prisma.tecnicaCorte.deleteMany({ where: { id, barbeariaId: session.barbeariaId } });
  revalidarCronometro();
}

export async function adicionarPasso(
  tecnicaId: string,
  _prev: CronometroAdminState,
  formData: FormData
): Promise<CronometroAdminState> {
  const session = await requireSession(["ADMIN"]);
  const texto = String(formData.get("texto") ?? "").trim();
  const etapa = String(formData.get("etapa") ?? "") as EtapaCorte;
  if (!texto) return { erro: "Escreva o passo." };
  if (!ETAPAS.includes(etapa)) return { erro: "Etapa inválida." };

  try {
    const tecnica = await prisma.tecnicaCorte.findFirst({ where: { id: tecnicaId, barbeariaId: session.barbeariaId } });
    if (!tecnica) return { erro: "Técnica não encontrada." };
    const ultimo = await prisma.passoTecnicaCorte.findFirst({
      where: { barbeariaId: session.barbeariaId, tecnicaId, etapa },
      orderBy: { ordem: "desc" },
    });
    await prisma.passoTecnicaCorte.create({
      data: { barbeariaId: session.barbeariaId, tecnicaId, etapa, texto, ordem: (ultimo?.ordem ?? -1) + 1 },
    });
  } catch {
    return { erro: ERRO_BANCO };
  }
  revalidarCronometro();
  return { sucesso: true };
}

export async function excluirPasso(id: string) {
  const session = await requireSession(["ADMIN"]);
  await prisma.passoTecnicaCorte.deleteMany({ where: { id, barbeariaId: session.barbeariaId } });
  revalidarCronometro();
}

export async function moverPasso(id: string, direcao: "cima" | "baixo") {
  const session = await requireSession(["ADMIN"]);
  const passo = await prisma.passoTecnicaCorte.findFirst({ where: { id, barbeariaId: session.barbeariaId } });
  if (!passo) return;

  const passos = await prisma.passoTecnicaCorte.findMany({
    where: { barbeariaId: session.barbeariaId, tecnicaId: passo.tecnicaId, etapa: passo.etapa },
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
  revalidarCronometro();
}

export async function criarDesafio(_prev: CronometroAdminState, formData: FormData): Promise<CronometroAdminState> {
  const session = await requireSession(["ADMIN"]);
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tecnicaId = String(formData.get("tecnicaId") ?? "") || null;
  const metaMinutos = Math.round(Number(formData.get("metaMinutos")));
  const diasSeguidos = Math.round(Number(formData.get("diasSeguidos")));

  if (!titulo) return { erro: "Informe o nome do desafio." };
  if (!Number.isFinite(metaMinutos) || metaMinutos < 1 || metaMinutos > 240) return { erro: "Meta de minutos inválida." };
  if (!Number.isFinite(diasSeguidos) || diasSeguidos < 1 || diasSeguidos > 90) return { erro: "Quantidade de dias inválida." };

  try {
    if (tecnicaId) {
      const tecnica = await prisma.tecnicaCorte.findFirst({ where: { id: tecnicaId, barbeariaId: session.barbeariaId } });
      if (!tecnica) return { erro: "Técnica não encontrada." };
    }
    await prisma.desafioCorte.create({
      data: { barbeariaId: session.barbeariaId, titulo, tecnicaId, metaMinutos, diasSeguidos },
    });
  } catch {
    return { erro: ERRO_BANCO };
  }
  revalidarCronometro();
  return { sucesso: true };
}

export async function alternarDesafioAtivo(id: string, ativo: boolean) {
  const session = await requireSession(["ADMIN"]);
  await prisma.desafioCorte.updateMany({ where: { id, barbeariaId: session.barbeariaId }, data: { ativo } });
  revalidarCronometro();
}

export async function excluirDesafio(id: string) {
  const session = await requireSession(["ADMIN"]);
  await prisma.desafioCorte.deleteMany({ where: { id, barbeariaId: session.barbeariaId } });
  revalidarCronometro();
}

/** Cria Low/Mid/High Fade com checklist e alguns desafios, pulando o que já existir pelo nome. */
export async function criarModelosProntos() {
  const session = await requireSession(["ADMIN"]);
  const barbeariaId = session.barbeariaId;

  const existentes = await prisma.tecnicaCorte.findMany({ where: { barbeariaId } });
  const porNome = new Map(existentes.map((t) => [t.nome.toLowerCase(), t]));
  let ordem = existentes.reduce((max, t) => Math.max(max, t.ordem), -1) + 1;

  for (const modelo of MODELOS_TECNICAS) {
    if (porNome.has(modelo.nome.toLowerCase())) continue;
    const tecnica = await prisma.tecnicaCorte.create({ data: { barbeariaId, nome: modelo.nome, ordem: ordem++ } });
    porNome.set(modelo.nome.toLowerCase(), tecnica);
    const ordemPorEtapa: Partial<Record<EtapaCorte, number>> = {};
    await prisma.passoTecnicaCorte.createMany({
      data: modelo.passos.map((p) => {
        const o = ordemPorEtapa[p.etapa] ?? 0;
        ordemPorEtapa[p.etapa] = o + 1;
        return { barbeariaId, tecnicaId: tecnica.id, etapa: p.etapa, texto: p.texto, ordem: o };
      }),
    });
  }

  const desafiosExistentes = await prisma.desafioCorte.findMany({ where: { barbeariaId }, select: { titulo: true } });
  const titulos = new Set(desafiosExistentes.map((d) => d.titulo.toLowerCase()));
  for (const d of MODELOS_DESAFIOS) {
    if (titulos.has(d.titulo.toLowerCase())) continue;
    await prisma.desafioCorte.create({
      data: {
        barbeariaId,
        titulo: d.titulo,
        tecnicaId: d.tecnica ? (porNome.get(d.tecnica.toLowerCase())?.id ?? null) : null,
        metaMinutos: d.metaMinutos,
        diasSeguidos: d.diasSeguidos,
      },
    });
  }

  revalidarCronometro();
}
