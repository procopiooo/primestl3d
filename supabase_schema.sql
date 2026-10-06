-- ==========================================================
-- ESTRUTURA COMPLETA DO BANCO DE DADOS NO SUPABASE (PRIME STL)
-- 1. Acesse o SQL Editor do seu projeto no Supabase
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================================

-- 1. Criação da tabela de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending',
    status_detail TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2),
    payer_name TEXT,
    payer_email TEXT,
    payer_phone TEXT,
    items JSONB,
    preference_id TEXT,
    mercado_pago_payment_id TEXT,
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adiciona a coluna payer_phone caso a tabela já tenha sido criada antes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pedidos' 
        AND column_name = 'payer_phone'
    ) THEN
        ALTER TABLE public.pedidos ADD COLUMN payer_phone TEXT;
    END IF;
END $$;

-- 2. Criação de índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_payer_email ON public.pedidos(payer_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_payer_phone ON public.pedidos(payer_phone);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_id ON public.pedidos(mercado_pago_payment_id);

-- 3. Criação da tabela de clientes (Área de Membros com Nome, Telefone e Senha)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    plano TEXT NOT NULL DEFAULT 'basic',
    status_pagamento TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criação de índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status_pagamento);

-- 5. Habilitação de RLS (Row Level Security) e Proteção Zero-Trust
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Remove políticas públicas excessivamente permissivas (evita vazamento de dados de clientes e pedidos)
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON public.pedidos;

DROP POLICY IF EXISTS "Permitir inserção de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir leitura de clientes" ON public.clientes;

-- Revoga acesso público direto (anon) às tabelas. Todo acesso deve ser mediado pelo backend Next.js:
REVOKE ALL ON public.pedidos FROM anon;
REVOKE ALL ON public.clientes FROM anon;

-- Permite acesso total apenas para service_role (usado pelas rotas seguras do Next.js via SUPABASE_SERVICE_ROLE_KEY)
GRANT ALL ON public.pedidos TO service_role;
GRANT ALL ON public.clientes TO service_role;

