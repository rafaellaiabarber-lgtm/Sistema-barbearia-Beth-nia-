# Barbearia Beth Nia

Sistema web para barbearia que atende por **ordem de chegada** (fila), com:

- **Totem de autoatendimento** (`/totem`): o cliente escolhe o(s) serviço(s), digita nome e telefone e entra na fila — sem precisar de login.
- **Painel da fila** (`/fila`): os barbeiros chamam o próximo cliente e concluem o atendimento. O admin acompanha todos os atendimentos em andamento.
- **Painel administrativo** (`/admin`): cadastro de serviços e preços, cadastro de barbeiros (com login próprio e comissão), histórico de clientes e relatório financeiro (hoje / semana / mês, total e por barbeiro).

## Tecnologias

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite) + autenticação própria via JWT em cookie httpOnly.

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o banco de dados (cria o `dev.db` local a partir do schema Prisma):
   ```bash
   npm run db:push
   ```
3. Popule com dados iniciais (usuário admin, barbeiros de exemplo e serviços):
   ```bash
   npm run db:seed
   ```
4. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra [http://localhost:3000](http://localhost:3000).

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
DATABASE_URL="file:./dev.db"
SESSION_SECRET="troque-esta-chave-em-producao-para-um-valor-secreto-longo"
```
