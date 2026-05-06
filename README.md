# Casa Estampa Interiores — Sistema de Orçamentos

Sistema completo de gestão de orçamentos de cortinas para a Casa Estampa Interiores.

## Requisitos

- Node.js 18+
- Docker e Docker Compose (para o banco de dados)

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Subir o banco de dados
docker-compose up -d

# 4. Rodar as migrations
npx prisma migrate dev

# 5. Popular o banco com dados de teste
npx prisma db seed

# 6. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse em: http://localhost:3000

## Credenciais de teste

| Perfil   | Email                          | Senha        |
|----------|-------------------------------|--------------|
| Admin    | admin@casaestampa.com.br      | admin123     |
| Vendedor | vendedor@casaestampa.com.br   | vendedor123  |

## Páginas do sistema

| URL                          | Acesso    | Descrição                        |
|------------------------------|-----------|----------------------------------|
| /login                       | Público   | Tela de login                    |
| /dashboard-vendedor          | Vendedor  | Dashboard do vendedor            |
| /dashboard-admin             | Admin     | Dashboard administrativo         |
| /orcamentos/novo             | Ambos     | Criar novo orçamento             |
| /clientes                    | Ambos     | Gestão de clientes               |
| /painel-pedidos              | Ambos     | Painel de pedidos e status       |
| /relatorios                  | Admin     | Relatórios e exportações         |
| /configuracoes               | Admin     | Configurações do sistema         |
| /configuracoes/usuarios      | Admin     | Gestão de usuários               |
| /orcamento/[token]           | Público   | Link público do orçamento        |

## Estrutura de pastas

```
app/
  (auth)/          # Páginas de autenticação
  (dashboard)/     # Páginas protegidas com sidebar
  api/             # API Routes
  orcamento/       # Link público de orçamento
components/
  layout/          # Sidebar, Header, BottomNav
  ui/              # Componentes reutilizáveis
lib/               # Prisma, auth, PDF, cálculos
prisma/            # Schema e seed
```

## Variáveis de ambiente

| Variável          | Descrição                              |
|-------------------|----------------------------------------|
| DATABASE_URL      | URL de conexão PostgreSQL              |
| NEXTAUTH_SECRET   | Chave secreta para JWT (mín. 32 chars) |
| NEXTAUTH_URL      | URL base da aplicação                  |

## Produção com Docker

```bash
docker-compose -f docker-compose.yml up -d
```
