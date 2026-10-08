import { supabaseAdmin } from './supabase.js';

/**
 * Sincroniza ativamente o status de pagamento entre Mercado Pago e Supabase.
 * Funciona como fallback à prova de falhas: garante que o cliente seja ativado
 * mesmo quando rodando em localhost (sem suporte a webhooks externos),
 * em caso de atraso na entrega do webhook ou ao acessar /sucesso ou /login.
 */
export async function syncPaymentStatus({ orderId = null, customerPhone = null, paymentId = null } = {}) {
  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      console.warn('[SYNC] MP_ACCESS_TOKEN não configurado.');
      return { approved: false };
    }

    let resolvedOrderId = orderId;
    let resolvedPhone = customerPhone ? String(customerPhone).replace(/\D/g, '') : null;
    let approvedPayment = null;

    // 1. Se foi fornecido paymentId direto (ex: vindo da URL de retorno /sucesso)
    if (paymentId) {
      try {
        const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.status === 'approved') {
            approvedPayment = pData;
            if (!resolvedOrderId && pData.external_reference) {
              resolvedOrderId = pData.external_reference;
            }
          }
        }
      } catch (err) {
        console.warn('[SYNC] Erro ao consultar pagamento por ID:', err.message);
      }
    }

    // 2. Se temos orderId e ainda não temos pagamento aprovado confirmado
    if (resolvedOrderId && !approvedPayment) {
      try {
        const moRes = await fetch(
          `https://api.mercadopago.com/merchant_orders/search?external_reference=${encodeURIComponent(resolvedOrderId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (moRes.ok) {
          const moData = await moRes.json();
          const element = moData.elements?.[0];
          if (element && Array.isArray(element.payments)) {
            const paid = element.payments.find((p) => p.status === 'approved');
            if (paid) {
              approvedPayment = paid;
            }
          }
        }
      } catch (err) {
        console.warn('[SYNC] Erro ao consultar merchant_orders por external_reference:', err.message);
      }
    }

    // 3. Se temos telefone mas não temos orderId, busca pedidos pendentes do telefone
    if (!approvedPayment && resolvedPhone) {
      try {
        const { data: userOrders } = await supabaseAdmin
          .from('pedidos')
          .select('id, preference_id, status, items')
          .eq('payer_phone', resolvedPhone)
          .order('created_at', { ascending: false })
          .limit(5);

        if (userOrders && userOrders.length > 0) {
          for (const ord of userOrders) {
            const moRes = await fetch(
              `https://api.mercadopago.com/merchant_orders/search?external_reference=${encodeURIComponent(ord.id)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (moRes.ok) {
              const moData = await moRes.json();
              const element = moData.elements?.[0];
              if (element && Array.isArray(element.payments)) {
                const paid = element.payments.find((p) => p.status === 'approved');
                if (paid) {
                  approvedPayment = paid;
                  resolvedOrderId = ord.id;
                  break;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[SYNC] Erro ao buscar pedidos por telefone:', err.message);
      }
    }

    // 4. Se encontrou pagamento aprovado, atualiza Supabase (pedidos e clientes)
    if (approvedPayment) {
      const paymentAmount = approvedPayment.transaction_amount || approvedPayment.total_paid_amount || 9.9;
      const mpPaymentId = String(approvedPayment.id);
      const paidAt = approvedPayment.date_approved || new Date().toISOString();

      let targetPlan = paymentAmount > 20 ? 'premium' : 'basic';

      // Atualiza o pedido se tivermos orderId
      if (resolvedOrderId) {
        const { data: updatedOrder } = await supabaseAdmin
          .from('pedidos')
          .update({
            status: 'approved',
            status_detail: approvedPayment.status_detail || 'accredited',
            mercado_pago_payment_id: mpPaymentId,
            amount_paid: paymentAmount,
            paid_at: paidAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedOrderId)
          .select('payer_phone, items')
          .single();

        if (updatedOrder) {
          if (updatedOrder.payer_phone && !resolvedPhone) {
            resolvedPhone = updatedOrder.payer_phone;
          }
          if (updatedOrder.items?.[0]?.id) {
            targetPlan = updatedOrder.items[0].id === 'premium' ? 'premium' : 'basic';
          }
        }
      }

      // Atualiza o cliente
      if (resolvedPhone) {
        await supabaseAdmin
          .from('clientes')
          .update({
            status_pagamento: 'approved',
            plano: targetPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('telefone', resolvedPhone);
      } else {
        console.warn(`[SYNC] Pagamento aprovado (${mpPaymentId}), mas nenhum telefone vinculado ao pedido ${resolvedOrderId}.`);
      }

      console.log(`[SYNC] Pagamento aprovado sincronizado com sucesso! Plano: ${targetPlan}`);
      return { approved: true, plan: targetPlan, orderId: resolvedOrderId };
    }

    return { approved: false };
  } catch (error) {
    console.error('[SYNC] Erro inesperado na sincronização:', error);
    return { approved: false };
  }
}
