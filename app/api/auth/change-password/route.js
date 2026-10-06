import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { verifySessionToken, verifyPassword, hashPassword } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const sessionCookie = request.cookies.get('prime_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie);
    if (!session || !session.telefone) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    // Rate Limiting para troca de senha (máx 5 tentativas por 10 min por telefone)
    const rateKey = `change-pwd:${session.telefone}`;
    const rateCheck = checkRateLimit(rateKey, 5, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Muitas tentativas incorretas. Aguarde ${rateCheck.resetInSeconds} segundos para tentar novamente.` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const { senhaAtual, novaSenha } = body;

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: 'Informe a senha atual e a nova senha.' },
        { status: 400 }
      );
    }

    if (typeof novaSenha !== 'string' || novaSenha.length < 6 || novaSenha.length > 128) {
      return NextResponse.json(
        { error: 'A nova senha deve ter entre 6 e 128 caracteres.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || session?.id === 'demo-user-123') {
      resetRateLimit(rateKey);
      return NextResponse.json({
        success: true,
        message: 'Senha alterada com sucesso! (Modo Demonstração)',
      });
    }

    // Busca o cliente para checar a senha atual
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('id, senha_hash')
      .eq('telefone', session.telefone)
      .single();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Valida a senha antiga
    const confere = verifyPassword(senhaAtual, cliente.senha_hash);
    if (!confere) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });
    }

    // Atualiza a senha no Supabase com novo hash seguro
    const novoHash = hashPassword(novaSenha);
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        senha_hash: novoHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cliente.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao salvar nova senha no banco de dados.' },
        { status: 500 }
      );
    }

    resetRateLimit(rateKey);

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi alterada com sucesso!',
    });
  } catch (error) {
    console.error('[CHANGE_PASSWORD] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao alterar senha.', details: error?.message },
      { status: 500 }
    );
  }
}

