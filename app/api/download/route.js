import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { syncPaymentStatus } from '@/lib/paymentSync';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPlan = searchParams.get('plan') || 'basic';
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id');

    let authorized = false;
    let allowedPlan = 'basic';

    // 0. Verificação de Modo Demonstração / Apresentação
    const isDemo = searchParams.get('demo') === 'true' || (orderId && orderId.startsWith('DEMO-'));
    if (isDemo) {
      authorized = true;
      allowedPlan = requestedPlan === 'premium' ? 'premium' : 'basic';
    }

    // 1. Verificação via Cookie de Sessão do Membro
    const sessionCookie = request.cookies.get('prime_session')?.value;
    if (sessionCookie && !authorized) {
      const session = verifySessionToken(sessionCookie);
      if (session?.id === 'demo-user-123') {
        authorized = true;
        allowedPlan = session.plano || requestedPlan;
      } else if (session?.telefone) {
        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('plano, status_pagamento')
          .eq('telefone', session.telefone)
          .single();

        if (cliente && cliente.status_pagamento === 'approved') {
          authorized = true;
          allowedPlan = cliente.plano || 'basic';
        }
      }
    }

    // 2. Verificação via Pedido Aprovado (ex: retorno da tela /sucesso)
    if (!authorized && (orderId || paymentId)) {
      if (orderId) {
        const { data: order } = await supabaseAdmin
          .from('pedidos')
          .select('status, items')
          .eq('id', orderId)
          .single();

        if (order && order.status === 'approved') {
          authorized = true;
          allowedPlan = order.items?.[0]?.id === 'premium' ? 'premium' : 'basic';
        }
      }

      // Se ainda não estava aprovado no banco, sincroniza com o Mercado Pago
      if (!authorized) {
        const syncRes = await syncPaymentStatus({ orderId, paymentId });
        if (syncRes.approved) {
          authorized = true;
          allowedPlan = syncRes.plan || 'basic';
        }
      }
    }

    // Se não estiver autorizado, bloqueia o download
    if (!authorized) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Faça login na Área de Membros para baixar seu arquivo.' },
        { status: 401 }
      );
    }

    // Se o cliente comprou o básico e tentar baixar o premium, serve apenas o básico permitido
    const finalPlan = allowedPlan === 'premium' && requestedPlan === 'premium' ? 'premium' : allowedPlan;

    // Strict Whitelist contra Path Traversal
    const fileName =
      finalPlan === 'premium'
        ? 'PRIME STL Premium.pdf'
        : 'PRIME STL Básico.pdf';

    // Procura o arquivo na pasta PDF ou public/downloads
    let filePath = path.join(process.cwd(), 'PDF', fileName);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'downloads', fileName);
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo PDF não encontrado no servidor.' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[DOWNLOAD] Erro ao servir arquivo PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar download do PDF.' },
      { status: 500 }
    );
  }
}
