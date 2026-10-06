import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

// Tabela de preços canônica do servidor para evitar adulteração de preço no frontend (Price Tampering)
const PREDEFINED_PLANS = {
  basic: {
    title: 'PRIME STL Básico — 1.000 Modelos',
    price: 9.9,
  },
  premium: {
    title: 'PRIME STL Premium — Acesso Total + 14 Coleções Bônus',
    price: 37.9,
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, items: rawItems, payer } = body;

    // 1. Determina a URL base da aplicação para back_urls e webhooks
    // Compatível com Vercel (process.env.VERCEL_URL) ou variável personalizada
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 2. Monta e valida os itens da compra estritamente no servidor (Anti-Price-Tampering)
    if (!planId || !PREDEFINED_PLANS[planId]) {
      return NextResponse.json(
        { error: 'Plano inválido selecionado para o checkout.' },
        { status: 400 }
      );
    }

    const plan = PREDEFINED_PLANS[planId];
    const itemsToProcess = [
      {
        id: planId,
        title: plan.title,
        unit_price: Number(plan.price),
        quantity: 1,
        currency_id: 'BRL',
      },
    ];
    const totalAmount = plan.price;

    // 3. Sanitização e validação dos dados do comprador
    let telefoneLimpo = null;
    if (payer?.telefone) {
      telefoneLimpo = String(payer.telefone).replace(/\D/g, '');
      if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
        return NextResponse.json(
          { error: 'Telefone inválido. Informe DDD e número (10 ou 11 dígitos).' },
          { status: 400 }
        );
      }
    }

    if (payer?.senha) {
      if (typeof payer.senha !== 'string' || payer.senha.length < 6 || payer.senha.length > 128) {
        return NextResponse.json(
          { error: 'A senha deve ter entre 6 e 128 caracteres.' },
          { status: 400 }
        );
      }
    }

    const sanitizedName = payer?.name ? String(payer.name).trim().slice(0, 100) : 'Cliente PRIME STL';

    if (telefoneLimpo && payer?.senha) {
      try {
        const senhaHash = hashPassword(payer.senha);
        const { error: clienteError } = await supabaseAdmin.from('clientes').upsert(
          {
            nome: sanitizedName,
            telefone: telefoneLimpo,
            senha_hash: senhaHash,
            plano: planId || 'basic',
            status_pagamento: 'pending',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'telefone' }
        );
        if (clienteError) {
          console.warn('[CHECKOUT] Aviso ao salvar cliente no Supabase:', clienteError.message);
        }
      } catch (err) {
        console.warn('[CHECKOUT] Erro ao processar dados do cliente:', err.message);
      }
    }

    // 4. Modo Demonstração / Apresentação de Portfólio
    if (!isMercadoPagoConfigured || !isSupabaseConfigured) {
      console.log('[CHECKOUT] Modo Apresentação: gerando checkout demonstrativo.');
      const demoOrderId = 'DEMO-' + Date.now();
      return NextResponse.json({
        order_id: demoOrderId,
        init_point: `${baseUrl}/sucesso?plan=${planId || 'premium'}&demo=true&orderId=${demoOrderId}${telefoneLimpo ? `&phone=${telefoneLimpo}` : ''}`,
        isDemo: true,
      });
    }

    // 5. Registra o pedido inicial com status 'pending' no Supabase
    const orderPayload = {
      status: 'pending',
      amount: totalAmount,
      items: itemsToProcess,
      payer_name: sanitizedName,
      payer_email: payer?.email ? String(payer.email).trim().slice(0, 150) : null,
      payer_phone: telefoneLimpo || null,
      created_at: new Date().toISOString(),
    };

    let { data: newOrder, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .insert([orderPayload])
      .select('id')
      .single();

    if (orderError && orderError.message?.includes('payer_phone')) {
      const fallbackPayload = { ...orderPayload };
      delete fallbackPayload.payer_phone;
      const fallbackAttempt = await supabaseAdmin
        .from('pedidos')
        .insert([fallbackPayload])
        .select('id')
        .single();
      newOrder = fallbackAttempt.data;
      orderError = fallbackAttempt.error;
    }

    const orderId = newOrder?.id || 'DEMO-' + Date.now();
    const isHttps = baseUrl.startsWith('https://');

    // 6. Cria a Preferência no Mercado Pago via SDK Oficial
    try {
      const preference = new Preference(mpClient);
      const preferenceData = {
        items: itemsToProcess,
        payer: {
          name: payer?.name || undefined,
          email: payer?.email || undefined,
        },
        metadata: {
          telefone: telefoneLimpo,
          plan_id: planId || 'basic',
          payer_name: payer?.name || 'Cliente',
        },
        back_urls: {
          success: `${baseUrl}/sucesso?plan=${planId || 'premium'}${telefoneLimpo ? `&phone=${telefoneLimpo}` : ''}`,
          failure: `${baseUrl}/falha`,
          pending: `${baseUrl}/pendente`,
        },
        ...(isHttps && { auto_return: 'approved' }),
        ...(isHttps && { notification_url: `${baseUrl}/api/webhook` }),
        external_reference: String(orderId),
        statement_descriptor: 'PRIME STL',
      };

      const mpResponse = await preference.create({ body: preferenceData });

      if (newOrder?.id) {
        await supabaseAdmin
          .from('pedidos')
          .update({ preference_id: mpResponse.id })
          .eq('id', orderId);
      }

      return NextResponse.json({
        order_id: orderId,
        preference_id: mpResponse.id,
        init_point: mpResponse.init_point,
        sandbox_init_point: mpResponse.sandbox_init_point,
      });
    } catch (mpError) {
      console.warn('[CHECKOUT] Erro na API Mercado Pago. Redirecionando para demonstração:', mpError.message);
      return NextResponse.json({
        order_id: orderId,
        init_point: `${baseUrl}/sucesso?plan=${planId || 'premium'}&demo=true&orderId=${orderId}${telefoneLimpo ? `&phone=${telefoneLimpo}` : ''}`,
        isDemo: true,
      });
    }
  } catch (error) {
    console.error('[CHECKOUT] Exceção inesperada na rota de checkout:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Erro interno ao processar checkout.',
        details: error?.cause || error?.details || null,
      },
      { status: 500 }
    );
  }
}
