import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      nome: "Administrador",
      login: "admin",
      senhaHash: senhaAdmin,
      role: "ADMIN",
    },
  });

  const barbeiro1 = await prisma.barbeiro.upsert({
    where: { id: "seed-barbeiro-1" },
    update: {},
    create: {
      id: "seed-barbeiro-1",
      nome: "Carlos",
      telefone: "11999990001",
      comissaoPercentual: 50,
    },
  });

  const barbeiro2 = await prisma.barbeiro.upsert({
    where: { id: "seed-barbeiro-2" },
    update: {},
    create: {
      id: "seed-barbeiro-2",
      nome: "Marcos",
      telefone: "11999990002",
      comissaoPercentual: 50,
    },
  });

  const senhaBarbeiro = await bcrypt.hash("barbeiro123", 10);
  await prisma.usuario.upsert({
    where: { login: "carlos" },
    update: {},
    create: {
      nome: "Carlos",
      login: "carlos",
      senhaHash: senhaBarbeiro,
      role: "BARBEIRO",
      barbeiroId: barbeiro1.id,
    },
  });
  await prisma.usuario.upsert({
    where: { login: "marcos" },
    update: {},
    create: {
      nome: "Marcos",
      login: "marcos",
      senhaHash: senhaBarbeiro,
      role: "BARBEIRO",
      barbeiroId: barbeiro2.id,
    },
  });

  const servicos = [
    { nome: "Corte de cabelo", precoCentavos: 4000, duracaoMinutos: 30 },
    { nome: "Barba", precoCentavos: 2500, duracaoMinutos: 20 },
    { nome: "Corte + Barba", precoCentavos: 6000, duracaoMinutos: 45 },
    { nome: "Sobrancelha", precoCentavos: 1500, duracaoMinutos: 10 },
  ];

  for (const s of servicos) {
    const existente = await prisma.servico.findFirst({ where: { nome: s.nome } });
    if (!existente) {
      await prisma.servico.create({ data: s });
    }
  }

  console.log("Seed concluído.");
  console.log("Login admin -> usuário: admin | senha: admin123");
  console.log("Login barbeiro -> usuário: carlos | senha: barbeiro123");
  console.log("Login barbeiro -> usuário: marcos | senha: barbeiro123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
