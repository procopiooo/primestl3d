import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncPaymentStatus } from '@/lib/paymentSync';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id') || searchParams.get('collection_id');
    const urlStatus = searchParams.get('status') || searchParams.get('collection_status');

    let plan = searchParams.get('plan') || 'basic';
    let status = urlStatus || 'approved';

    const isDemo = searchParams.get('demo') === 'true' || (orderId && orderId.startsWith('DEMO-'));
    if (isDemo) {
      status = 'approved';
    } else if (orderId || paymentId) {
      // Se temos orderId ou paymentId, sincroniza ativamente com o Mercado Pago e Supabase
      const syncRes = await syncPaymentStatus({ orderId, paymentId });
      if (syncRes.approved) {
        status = 'approved';
        if (syncRes.plan) plan = syncRes.plan;
      }
    }

    // Carrega os links do Google Drive de lib/driveLinks.json
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

    // Se tiver orderId, consulta no Supabase para saber exatamente qual foi o plano comprado
    if (orderId) {
      const { data: order } = await supabaseAdmin
        .from('pedidos')
        .select('id, status, items, amount')
        .eq('id', orderId)
        .single();

      if (order) {
        if (order.status === 'approved') status = 'approved';
        const itemId = order.items?.[0]?.id;
        if (itemId === 'premium' || order.amount > 20) {
          plan = 'premium';
        } else {
          plan = 'basic';
        }
      }
    }

    const driveUrl = plan === 'premium' ? driveLinks.premium : driveLinks.basic;
    const pdfFileName = plan === 'premium' ? 'PRIME STL Premium.pdf' : 'PRIME STL Básico.pdf';

    return NextResponse.json({
      plan,
      status,
      pdfFileName,
      downloadUrl: `/api/download?plan=${plan}${isDemo ? '&demo=true' : ''}${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ''}${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ''}`,
      driveUrl,
    });
  } catch (error) {
    console.error('[ORDER_STATUS] Erro:', error);
    return NextResponse.json(
      { plan: 'basic', downloadUrl: '/api/download?plan=basic' },
      { status: 200 }
    );
  }
}
