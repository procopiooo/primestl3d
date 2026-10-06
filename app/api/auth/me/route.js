import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('prime_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie);
    if (!session || !session.telefone) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    let cliente = null;

    if (!isSupabaseConfigured || session?.id === 'demo-user-123') {
      cliente = {
        id: session.id || 'demo-user-123',
        nome: session.nome || 'Visitante (Modo Demonstração)',
        telefone: session.telefone,
        plano: session.plano || 'premium',
        status_pagamento: 'approved',
      };
    } else {
      // Busca dados atualizados do cliente no Supabase
      const { data: dbCliente, error } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, telefone, plano, status_pagamento')
        .eq('telefone', session.telefone)
        .single();

      if (error || !dbCliente || dbCliente.status_pagamento !== 'approved') {
        return NextResponse.json({ error: 'Acesso não liberado' }, { status: 403 });
      }
      cliente = dbCliente;
    }

    // Carrega links do Google Drive
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

    const isPremium = cliente.plano === 'premium';

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        plano: cliente.plano,
      },
      entrega: {
        planoTitulo: isPremium ? 'PRIME STL Premium' : 'PRIME STL Básico',
        pdfFileName: isPremium ? 'PRIME STL Premium.pdf' : 'PRIME STL Básico.pdf',
        downloadUrl: `/api/download?plan=${cliente.plano}`,
        driveUrl: isPremium ? driveLinks.premium : driveLinks.basic,
        totalModelos: isPremium ? '150.000+ Modelos + 14 Bônus' : '1.000 Modelos',
      },
    });
  } catch (error) {
    console.error('[AUTH_ME] Erro:', error);
    return NextResponse.json({ error: 'Erro ao verificar sessão' }, { status: 500 });
  }
}

