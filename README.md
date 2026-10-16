# Cronômetro de Corte

App para os alunos do curso: o barbeiro cronometra cada etapa do corte e descobre onde perde tempo.

- **Cronômetro por etapa** — máquina, transição, acabamento e finalização, com o checklist da técnica na tela. Continua de onde parou se a tela apagar, e mantém a tela acesa enquanto roda.
- **Onde perde mais tempo** — média de cada etapa comparada com a média da turma, com dica do que ajustar.
- **Evolução** — gráfico por técnica e a frase "seu Mid Fade caiu de 45 para 32 minutos".
- **Desafios e selos** — ex.: "7 dias abaixo de 35 minutos".
- **Calculadora de ganho** — quantos cortes e quanto dinheiro a mais por mês cortando mais rápido. Tem também uma versão **pública** em `/calculadora`, sem login, pra divulgar o curso.
- **Ranking da turma** — pela média dos últimos 5 cortes de cada técnica.

Painel do instrutor (`/instrutor`): cadastra alunos (o app gera a senha), liga/desliga um **código do curso** pra o aluno criar a própria conta, bloqueia acesso, cadastra técnicas, checklist e desafios (tem modelos prontos de Low/Mid/High Fade) e vê onde cada aluno perde tempo.

É um app web instalável: no celular, o aluno abre o link e usa **Adicionar à tela inicial** — fica com ícone e tela cheia, como um app.

## Colocar no ar (Vercel, gratuito)

1. Crie um banco Postgres gratuito em [neon.tech](https://neon.tech) (ou na aba **Storage** da Vercel) e copie a `DATABASE_URL`.
2. Em [vercel.com](https://vercel.com) → **Add New → Project**, importe este repositório.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: a string do passo 1
   - `SESSION_SECRET`: um texto aleatório e longo
4. Clique em **Deploy**. As tabelas são criadas automaticamente no build.
5. Abra o endereço gerado: na primeira vez aparece **Configurar o app** — crie a sua conta de instrutor. Essa tela some depois disso, então faça esse passo logo após o deploy.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e SESSION_SECRET
npm run db:push
npm run dev
```

Next.js + TypeScript + Tailwind + Prisma (PostgreSQL), com login próprio via JWT em cookie httpOnly.
