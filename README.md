# 🚀 PRIME STL — E-commerce & Área de Membros para Impressão 3D

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-Checkout%20API-009EE3?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel)

Plataforma fullstack completa para venda, gestão e entrega digital de modelos STL voltados para impressão 3D. O projeto combina uma Landing Page imersiva com renderização 3D em tempo real (WebGL), checkout automatizado integrado ao **Mercado Pago** com confirmação assíncrona por **Webhooks**, e uma **Área de Membros VIP** segura com downloads protegidos e controle de acesso a coleções na nuvem.

---

## ✨ Funcionalidades Principais

* **🎨 Landing Page Interativa com Three.js:** Animação procedural 3D de alta performance renderizada diretamente no navegador via WebGL, com responsividade total e SEO otimizado (Schema.org / JSON-LD).
* **💳 Checkout Automatizado & Webhooks:** Integração direta com a API oficial do Mercado Pago (Pix e Cartão), com conciliação automática de pagamentos via Webhook e sincronização de contingência (*polling fallback*).
* **🔒 Área de Membros VIP:** Sistema completo de login, autenticação segura com cookies HTTP-Only e painel exclusivo para consulta de pacotes e alteração de senha.
* **📦 Downloads Protegidos:** Rota de entrega de arquivos com verificação estrita de autorização (apenas clientes com pagamento aprovado no banco de dados conseguem efetuar o download dos PDFs e acessar as coleções).
* **🛡️ Arquitetura Blindada (Security-First):**
  * **Zero-Trust Database:** Políticas estritas de Row Level Security (RLS) no Supabase bloqueando o acesso público anônimo a senhas e pedidos.
  * **Anti-Price Tampering:** Preços canônicos validados estritamente no backend, impedindo adulteração de valores via frontend ou DevTools.
  * **Brute-Force Protection:** Rate Limiter em memória (*sliding-window*) com bloqueio temporário (HTTP 429) em tentativas repetidas de login.
  * **Timing-Safe Session Validation:** Assinatura HMAC-SHA256 validada com `crypto.timingSafeEqual` para neutralizar ataques de timing.
  * **HTTP Security Headers:** Configuração de HSTS, `X-Frame-Options: SAMEORIGIN` (anti-clickjacking), `X-Content-Type-Options: nosniff` e remoção de cabeçalhos de reconhecimento de tecnologia.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **Next.js 14** (App Router & Pages Router híbrido)
* **React 18**
* **Three.js** (WebGL 3D engine)
* **Tailwind CSS**
* **Lucide Icons**

### Backend & APIs
* **Next.js Serverless Functions** (Node.js runtime)
* **Mercado Pago Node.js SDK** (v2)
* **Node.js Crypto** (`scrypt` para hash de senhas, HMAC para tokens de sessão)

### Banco de Dados & Autenticação
* **Supabase** (PostgreSQL Serverless)
* **PostgreSQL Row Level Security (RLS)**

### Infraestrutura & Deploy
* **Vercel** (Edge Network, Serverless Functions e CDN)

---

## 📁 Estrutura de Pastas do Projeto

```text
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js          # Autenticação com rate limiting
│   │   │   ├── logout/route.js         # Revogação segura de sessão
│   │   │   ├── me/route.js             # Verificação de status do membro
│   │   │   └── change-password/        # Troca de senha autenticada
│   │   ├── checkout/route.js           # Criação de preferências Mercado Pago
│   │   ├── download/route.js           # Download autorizado de arquivos
│   │   ├── order-status/route.js       # Consulta e sincronização de pedidos
│   │   └── webhook/route.js            # Notificações assíncronas de pagamento
│   ├── login/page.jsx                  # Tela de autenticação VIP
│   ├── painel/page.jsx                 # Painel do membro autenticado
│   ├── sucesso/page.jsx                # Tela de confirmação pós-compra
│   ├── pendente/page.jsx               # Tela de status pendente
│   ├── falha/page.jsx                  # Tela de pagamento não aprovado
│   └── layout.jsx                      # Layout global da aplicação
├── pages/
│   └── index.js                        # Rota raiz oficial integrada à Landing Page
├── lib/
│   ├── auth.js                         # Utilitários de criptografia e sessão
│   ├── mercadopago.js                  # Inicialização do SDK Mercado Pago
│   ├── paymentSync.js                  # Motor de sincronização de pagamentos
│   ├── rateLimit.js                    # Rate limiter contra ataques de força bruta
│   └── supabase.js                     # Cliente administrativo Supabase
├── public/
│   ├── downloads/                      # PDFs e arquivos para entrega
│   └── images/                         # Catálogo de imagens e miniaturas
├── index.html                          # Landing page completa com Three.js
├── supabase_schema.sql                 # Script SQL de tabelas, índices e RLS
├── next.config.mjs                     # Configurações de headers e tracing
└── vercel.json                         # Configuração de framework para a Vercel
```

---

## ⚙️ Como Executar o Projeto Localmente

### 1. Pré-requisitos
* **Node.js** (versão 18.x ou superior)
* **npm** ou **yarn**
* Uma conta no **Supabase** e no **Mercado Pago Developers**

### 2. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd prime-stl
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as suas credenciais:

```env
# URL base da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mercado Pago (Token de Teste ou Produção)
MP_ACCESS_TOKEN=TEST-seu-token-aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta

# Chave secreta para criptografia de sessões
SESSION_SECRET=coloque-uma-chave-longa-e-aleatoria-aqui
```

### 5. Configurar o Banco de Dados no Supabase
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com).
2. Vá até a aba **SQL Editor** e clique em **New query**.
3. Copie o conteúdo do arquivo [`supabase_schema.sql`](./supabase_schema.sql), cole no editor e execute (**Run**).

### 6. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação em funcionamento!

---

## 🌐 Deploy na Vercel

1. Suba o código para o seu repositório no **GitHub**.
2. No painel da [Vercel](https://vercel.com), clique em **Add New** ➔ **Project** e importe o repositório.
3. Configure as **Environment Variables** com os mesmos valores do seu `.env.local` (atualizando `NEXT_PUBLIC_APP_URL` com o seu domínio final em produção).
4. Clique em **Deploy**. O projeto já está configurado com `next.config.mjs` e `vercel.json` para compilar e rodar sem atritos.

---

## 📄 Licença & Apresentação

Projeto desenvolvido para fins de apresentação e demonstração fullstack. Todos os direitos reservados.

