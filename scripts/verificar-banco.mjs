// Roda antes de criar/atualizar as tabelas no build. Se o banco configurado já tiver tabelas
// que não são deste app (ex.: o banco do sistema da barbearia), para tudo sem alterar nada.
import { PrismaClient } from "@prisma/client";

const TABELAS_DO_APP = new Set([
  "Usuario",
  "Configuracao",
  "TecnicaCorte",
  "PassoTecnicaCorte",
  "RegistroCorte",
  "DesafioCorte",
  "_prisma_migrations",
]);

const prisma = new PrismaClient();
try {
  const tabelas = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const estranhas = tabelas.map((t) => t.table_name).filter((nome) => !TABELAS_DO_APP.has(nome));
  if (estranhas.length > 0) {
    console.error(
      `\n✋ O DATABASE_URL aponta para um banco que já tem outras tabelas (${estranhas.slice(0, 5).join(", ")}...).\n` +
        "   Este app (Cronômetro de Corte) precisa de um banco só dele. Nada foi alterado.\n" +
        "   Crie um banco novo pela aba Storage do projeto cronometro-de-corte na Vercel.\n"
    );
    process.exit(1);
  }
} finally {
  await prisma.$disconnect();
}
