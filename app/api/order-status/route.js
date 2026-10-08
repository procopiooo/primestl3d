import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncPaymentStatus } from '@/lib/paymentSync';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id') || searchParams.get('collection_id');

    let isAuthorized = false;
    let plan = 'basic';
    let status = 'pending';

    // 1. Verificação via Cookie de Sessão de Membro autenticado
    const sessionCookie = request.cookies.get('prime_session')?.value;
    if (sessionCookie) {
      const session = verifySessionToken(sessionCookie);
      if (session?.telefone) {
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('plano, status_pagamento')
          .eq('telefone', session.telefone)
          .single();

        if (cliente && cliente.status_pagamento === 'approved') {
          isAuthorized = true;
          status = 'approved';
          plan = cliente.plano || 'basic';
        }
      }
    }

    // 2. Verificação via Pedido/Pagamento aprovado (ex: retorno da tela /sucesso)
    if (orderId || paymentId) {
      if (orderId) {
        const { data: order } = await supabaseAdmin
          .from('pedidos')
          .select('id, status, items, amount')
          .eq('id', orderId)
          .single();

        if (order && order.status === 'approved') {
          isAuthorized = true;
          status = 'approved';
          const itemId = order.items?.[0]?.id;
          plan = itemId === 'premium' || order.amount > 20 ? 'premium' : 'basic';
        }
      }

      // Se ainda não estava aprovado no banco, sincroniza ativamente com o Mercado Pago
      if (!isAuthorized) {
        const syncRes = await syncPaymentStatus({ orderId, paymentId });
        if (syncRes.approved) {
          isAuthorized = true;
          status = 'approved';
          plan = syncRes.plan || 'basic';
        }
      }
    }

    // Se não for uma requisição autorizada ou com pagamento aprovado, bloqueia o acesso
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Acesso não autorizado ou pedido não aprovado.' },
        { status: 401 }
      );
    }

    // Carrega links do Google Drive de forma segura (somente após autorização)
    let driveLinks = {
      basic: 'https://drive.google.com/drive/folders/COLE_AQUI_SEU_LINK_DO_DRIVE_BASICO',
      premium: 'https://drive.google.com/drive/folders/COLE_AQUI_SEU_LINK_DO_DRIVE_PREMIUM',
    };

    try {
      const jsonPath = path.join(process.cwd(), 'lib', 'driveLinks.json');
      if (fs.existsSync(jsonPath)) {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (raw.basicDriveLink) driveLinks.basic = raw.basicDriveLink;
        if (raw.premiumDriveLink) driveLinks.premium = raw.premiumDriveLink;
      }
    } catch {
      // fallback
    }

    const driveUrl = plan === 'premium' ? driveLinks.premium : driveLinks.basic;
    const pdfFileName = plan === 'premium' ? 'PRIME STL Premium.pdf' : 'PRIME STL Básico.pdf';

    return NextResponse.json({
      plan,
      status,
      pdfFileName,
      downloadUrl: `/api/download?plan=${plan}${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ''}${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ''}`,
      driveUrl,
    });
  } catch (error) {
    console.error('[ORDER_STATUS] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar status do pedido.' },
      { status: 500 }
    );
  }
}
