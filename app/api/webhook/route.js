import { NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Rota de Webhook do Mercado Pago (Next.js App Router)
 * Escuta notificações assíncronas de pagamento e sincroniza o status no Supabase
 */
export async function POST(request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Tenta obter o corpo da requisição de forma resiliente
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // 1. Identifica o ID do pagamento a partir do body (Webhooks v2) ou searchParams (IPN)
    const paymentId =
      body?.data?.id ||
      searchParams.get('data.id') ||
      (searchParams.get('topic') === 'payment' ? searchParams.get('id') : null) ||
      (body?.type === 'payment' ? body?.id : null);

    const actionType = body?.action || body?.type || searchParams.get('topic');

    // Se o evento recebido não for relacionado a um pagamento ou não contiver ID,
    // retornamos 200 para cessar retentativas desnecessárias do gateway
    if (!paymentId) {
      console.log(`[WEBHOOK] Notificação ignorada (sem ID de pagamento). Tipo: ${actionType}`);
      return NextResponse.json({ message: 'Evento recebido sem ID de pagamento' }, { status: 200 });
    }

    console.log(`[WEBHOOK] Processando pagamento Mercado Pago ID: ${paymentId}`);

    // 2. Consulta a API oficial do Mercado Pago para obter o estado autêntico do pagamento
    // Essa consulta direta protege a aplicação contra ataques de spoofing/falsificação de webhook
    const paymentInstance = new Payment(mpClient);
    const payment = await paymentInstance.get({ id: paymentId });

    if (!payment || !payment.id) {
      console.error(`[WEBHOOK] Falha ao consultar pagamento ${paymentId} na API do Mercado Pago.`);
      return NextResponse.json({ error: 'Pagamento não localizado na API do Mercado Pago' }, { status: 404 });
    }

    const {
      status,
      status_detail,
      external_reference: orderId,
      payment_method_id,
      transaction_amount,
      date_approved,
    } = payment;

    console.log(
      `[WEBHOOK] Pagamento ${paymentId} consultado. Status: "${status}" | Pedido Supabase: "${orderId}"`
    );

    // Valida se o pagamento possui um orderId amarrado
    if (!orderId) {
      console.warn(`[WEBHOOK] Pagamento ${paymentId} não possui external_reference (Order ID).`);
      return NextResponse.json(
        { message: 'Pagamento sem vínculo com pedido da aplicação' },
        { status: 200 }
      );
    }

    // 3. Atualiza o status do pedido na tabela 'pedidos' do Supabase
    const updatePayload = {
      status: status, // 'approved', 'pending', 'in_process', 'rejected', 'refunded', etc.
      status_detail: status_detail || null,
      mercado_pago_payment_id: String(payment.id),
      payment_method: payment_method_id || null,
      amount_paid: transaction_amount || null,
      paid_at: date_approved ? new Date(date_approved).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update(updatePayload)
      .eq('id', orderId)
      .select('id, status, payer_email, payer_name, payer_phone, items')
      .single();

    if (updateError) {
      console.error(`[WEBHOOK] Erro ao atualizar pedido ${orderId} no Supabase:`, updateError);
      return NextResponse.json(
        { error: 'Erro ao persistir status no Supabase' },
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] Pedido ${orderId} atualizado com sucesso para "${status}".`);

    // 4. Se o pagamento foi aprovado, ativa o acesso do cliente no Supabase
    if (status === 'approved') {
      const planoComprado = updatedOrder?.items?.[0]?.id === 'premium' ? 'premium' : 'basic';

      if (updatedOrder?.payer_phone) {
        await supabaseAdmin
          .from('clientes')
          .update({
            status_pagamento: 'approved',
            plano: planoComprado,
            updated_at: new Date().toISOString(),
          })
          .eq('telefone', updatedOrder.payer_phone);
      } else {
        const customerPhone = payment?.metadata?.telefone;
        if (customerPhone) {
          await supabaseAdmin
            .from('clientes')
            .update({
              status_pagamento: 'approved',
              plano: planoComprado,
              updated_at: new Date().toISOString(),
            })
            .eq('telefone', customerPhone);
        } else {
          const { data: latestPending } = await supabaseAdmin
            .from('clientes')
            .select('id')
            .eq('status_pagamento', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestPending?.id) {
            await supabaseAdmin
              .from('clientes')
              .update({
                status_pagamento: 'approved',
                plano: planoComprado,
                updated_at: new Date().toISOString(),
              })
              .eq('id', latestPending.id);
          }
        }
      }

      console.log(`[WEBHOOK] Conta do cliente ativada com sucesso para o plano: "${planoComprado}".`);
    }

    // 5. Retorna status 200 informando ao Mercado Pago que o webhook foi processado com sucesso
    return NextResponse.json(
      {
        received: true,
        orderId,
        paymentId: payment.id,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WEBHOOK] Exceção crítica ao processar webhook do Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar notificação do webhook', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * Suporte a requisição GET para testes de verificação ou health check
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'active',
      service: 'Mercado Pago Webhook Handler',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
