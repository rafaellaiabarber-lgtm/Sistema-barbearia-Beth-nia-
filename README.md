# Barbearia Bethânia

Sistema web para barbearia que atende por **ordem de chegada** (fila), com:

- **Totem de autoatendimento** (`/totem`): o cliente informa telefone, nome e escolhe (opcionalmente) o barbeiro de preferência, e entra na fila — sem precisar de login.
- **Painel da fila** (`/fila`): os barbeiros chamam o próximo cliente e, ao concluir, escolhem o(s) serviço(s) realizado(s) — isso calcula o valor e já registra no financeiro. O admin acompanha todos os atendimentos em andamento.
- **Painel administrativo** (`/admin`): cadastro de serviços e preços, cadastro de barbeiros (com login próprio, comissão e foto), histórico de clientes e relatório financeiro (hoje / semana / mês, total e por barbeiro).

## Tecnologias

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (PostgreSQL) + autenticação própria via JWT em cookie httpOnly.

## Como rodar localmente

Requer um banco PostgreSQL (local ou na nuvem — veja a seção de deploy abaixo para criar um gratuito).

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` com a string de conexão do seu Postgres.
3. Crie as tabelas a partir do schema Prisma:
   ```bash
   npm run db:push
   ```
4. Popule com dados iniciais (usuário admin, barbeiros de exemplo e serviços):
   ```bash
   npm run db:seed
   ```
5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
6. Abra [http://localhost:3000](http://localhost:3000).

### Logins de exemplo (criados pelo seed)

| Papel     | Usuário  | Senha        |
|-----------|----------|--------------|
| Admin     | `admin`  | `admin123`   |
| Barbeiro  | `carlos` | `barbeiro123`|
| Barbeiro  | `marcos` | `barbeiro123`|

> Troque essas senhas e o valor de `SESSION_SECRET` no `.env` antes de usar em produção.

## Fluxo de uso

1. Deixe a tela `/totem` aberta em um tablet/totem na entrada da barbearia para os clientes se cadastrarem na fila.
2. Cada barbeiro acessa `/fila` com seu próprio login para chamar o próximo cliente e marcar o atendimento como concluído (isso já registra o valor no financeiro).
3. O admin acessa `/admin` para gerenciar serviços, barbeiros, ver o histórico de clientes e acompanhar o financeiro.

## Variáveis de ambiente (`.env`)

```
DATABASE_URL="postgresql://usuario:senha@host:5432/nome_do_banco"
SESSION_SECRET="troque-esta-chave-em-producao-para-um-valor-secreto-longo"
```

## Deploy no Vercel

1. Crie um banco Postgres gratuito — pela própria Vercel (aba **Storage** do projeto → **Create Database** → Postgres) ou em [neon.tech](https://neon.tech). Copie a `DATABASE_URL` gerada.
2. No [vercel.com](https://vercel.com), clique em **Add New → Project** e importe este repositório do GitHub.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: a string de conexão do passo 1
   - `SESSION_SECRET`: um texto aleatório e longo (ex: gerado com `openssl rand -base64 32`)
4. Clique em **Deploy**. O Vercel detecta o Next.js automaticamente.
5. Depois do primeiro deploy, crie as tabelas e os dados iniciais no banco de produção rodando localmente (com o `.env` apontando para a mesma `DATABASE_URL` da Vercel):
   ```bash
   npm run db:push
   npm run db:seed
   ```
6. **Foto dos barbeiros**: no projeto na Vercel, vá em **Storage → Create Database → Blob** para habilitar o armazenamento de imagens. A Vercel injeta a variável `BLOB_READ_WRITE_TOKEN` automaticamente — não precisa copiar nada manualmente. Sem isso, o upload de foto no cadastro de barbeiros não funciona.
7. Acesse a URL gerada pela Vercel — `/totem` para o totem do cliente e `/login` para a equipe.

> Troque as senhas do seed (`admin123`, `barbeiro123`) assim que possível pelo painel de barbeiros/admin.
