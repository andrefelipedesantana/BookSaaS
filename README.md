# LivroSaaS 📚✨

Construí um projeto chamado **LivroSaaS**, uma plataforma de assinatura onde o usuário tem acesso a ebooks mensais sobre programação de forma simples e direta. O principal objetivo prático deste projeto para mim foi conhecer e aprender sobre integração de ferramentas robustas de mercado, com foco especial no **Stripe** para pagamentos e no **Supabase** como banco de dados escalável.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Componentes & Ícones:** shadcn/ui, Lucide React
- **Banco de Dados:** Supabase (PostgreSQL)
- **ORM / Conexão DB:** Prisma
- **Autenticação:** NextAuth.js
- **Pagamentos & Assinaturas:** Stripe (Embedded Checkout & Customer Portal)

## ⚙️ Como configurar e rodar localmente

Siga os passos abaixo para rodar a aplicação na sua máquina:

1. **Clone o repositório:**
```bash
git clone https://github.com/andrefelipedesantana/BookSaaS.git
cd BookSaaS
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:** 
Crie um arquivo `.env` na raiz do projeto com as suas chaves do Stripe, Supabase e NextAuth:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
DATABASE_URL=postgresql://postgres:[SENHA]@db.seu-id.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[SENHA]@db.seu-id.supabase.co:5432/postgres

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/...

AUTH_SECRET=sua-chave-secreta-do-next-auth
```

4. **Prepare o Banco de Dados:**
Rode as migrações do Prisma para criar as tabelas no Supabase:
```bash
npx prisma migrate dev
```

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

6. **Acesse no navegador:** Abra `http://localhost:3000` para ver o site funcionando.

## 💳 Integração com Stripe e Supabase

Uma das maiores vantagens dessa arquitetura é lidar com lógica de negócios complexa de forma organizada e segura, separando as responsabilidades. 

### Visão Geral do Fluxo

**1. Supabase como Single Source of Truth:**
Utilizei o Supabase (PostgreSQL) integrado ao Prisma para gerenciar nossos usuários e guardar o estado da aplicação. A troca do SQLite local para o Supabase me permitiu entender a dinâmica de um banco relacional em nuvem, rodando migrações remotamente e separando o ambiente de desenvolvimento do banco local.

**2. Fluxo de Assinatura (Stripe Embedded Checkout):**
A conversão do usuário acontece sem sair do ecossistema do app.
- O usuário clica em "Assinar".
- O Next.js (via Server Actions / Route Handlers) se comunica com a API do Stripe e cria uma "Checkout Session".
- O Stripe devolve um `client_secret`, que é passado para o componente `<EmbeddedCheckout />`, renderizando o formulário de pagamento dentro de um Modal (`Dialog`) nativo do site.

**3. Gestão e Cancelamento:**
Criei painéis onde o usuário gerencia a própria assinatura:
- **Painel de Faturamento:** Um link direto para o Stripe Customer Portal, onde o usuário troca cartão e baixa notas fiscais.
- **Cancelamento Direto:** Uma Server Action segura (`cancel-subscription.ts`) que usa a SDK do Stripe para buscar o ID da assinatura do usuário logado e executar o comando de cancelamento instantâneo via código, seguido de uma revalidação inteligente do layout usando o `revalidatePath` do Next.js.
