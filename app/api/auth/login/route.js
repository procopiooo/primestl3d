import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { syncPaymentStatus } from '@/lib/paymentSync';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');

    const body = await request.json();
    const { telefone: rawTelefone, senha } = body;

    if (!rawTelefone || !senha) {
      return NextResponse.json(
        { error: 'Por favor, informe seu telefone e senha.' },
        { status: 400 }
      );
    }

    // Normaliza telefone para apenas dígitos
    const telefone = String(rawTelefone).replace(/\D/g, '');

    // Proteção contra ataques de força bruta (Brute-Force Protection)
    const rateLimitKey = `login:${clientIp}:${telefone}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Muitas tentativas de login consecutivas. Por segurança, aguarde ${rateCheck.resetInSeconds} segundos antes de tentar novamente.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
        }
      );
    }

    // Modo Apresentação / Portfólio (Sem dependência de banco em live demo)
    if (!isSupabaseConfigured) {
      resetRateLimit(rateLimitKey);
      const demoCliente = {
        id: 'demo-user-123',
        nome: 'Visitante (Modo Demonstração)',
        telefone: telefone || '11999999999',
        plano: 'premium',
        status_pagamento: 'approved',
      };
      const sessionToken = createSessionToken(demoCliente);
      const response = NextResponse.json({
        success: true,
        redirect: '/painel',
        isDemo: true,
        cliente: {
          nome: demoCliente.nome,
          telefone: demoCliente.telefone,
          plano: demoCliente.plano,
        },
      });

      response.cookies.set('prime_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // Busca cliente na tabela 'clientes' do Supabase
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, telefone, senha_hash, plano, status_pagamento')
      .eq('telefone', telefone)
      .single();

    if (error || !cliente) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada para este telefone. Adquira um plano para liberar seu acesso.' },
        { status: 404 }
      );
    }

    // Valida a senha criptografada
    const senhaValida = verifyPassword(senha, cliente.senha_hash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Senha incorreta. Tente novamente.' },
        { status: 401 }
      );
    }

    // Login com sucesso: reseta o contador de tentativas de brute-force
    resetRateLimit(rateLimitKey);

    // Valida status do pagamento
    if (cliente.status_pagamento !== 'approved') {
      const syncResult = await syncPaymentStatus({ customerPhone: telefone });
      if (syncResult.approved) {
        cliente.status_pagamento = 'approved';
        cliente.plano = syncResult.plan || cliente.plano;
      } else {
        return NextResponse.json(
          { error: 'Seu pagamento ainda está aguardando confirmação. Assim que aprovado pelo Mercado Pago, o acesso será liberado.' },
          { status: 403 }
        );
      }
    }

    // Gera token de sessão seguro
    const sessionToken = createSessionToken(cliente);

    const response = NextResponse.json({
      success: true,
      redirect: '/painel',
      cliente: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        plano: cliente.plano,
      },
    });

    // Define cookie de sessão HTTP-Only
    response.cookies.set('prime_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return response;
  } catch (error) {
    console.error('[AUTH_LOGIN] Erro ao autenticar:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar login.', details: error?.message },
      { status: 500 }
    );
  }
}

