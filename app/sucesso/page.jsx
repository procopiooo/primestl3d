'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConteudoSucesso() {
  const searchParams = useSearchParams();

  // Parâmetros enviados pelo Mercado Pago via back_urls
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const status = searchParams.get('status') || searchParams.get('collection_status') || 'approved';
  const orderId = searchParams.get('external_reference');
  const paymentType = searchParams.get('payment_type');
  const initialPlan = searchParams.get('plan') || 'basic';

  const [orderData, setOrderData] = useState({
    plan: initialPlan,
    pdfFileName: initialPlan === 'premium' ? 'PRIME STL Premium.pdf' : 'PRIME STL Básico.pdf',
    downloadUrl: `/api/download?plan=${initialPlan}`,
    driveUrl: 'https://drive.google.com/drive/folders/COLE_AQUI_SEU_LINK_DO_DRIVE_BASICO',
  });

  const [carregando, setCarregando] = useState(true);

  // Consulta detalhes do pedido e links atualizados
  useEffect(() => {
    async function carregarDados() {
      try {
        const params = new URLSearchParams();
        if (orderId) params.set('orderId', orderId);
        if (paymentId) params.set('paymentId', paymentId);
        if (status) params.set('status', status);
        if (initialPlan) params.set('plan', initialPlan);

        const res = await fetch(`/api/order-status?${params.toString()}`);
        const data = await res.json();
        if (data?.plan) {
          setOrderData(data);
        }
      } catch (e) {
        console.warn('Erro ao consultar pedido:', e);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [orderId, paymentId, status, initialPlan]);

  // Inicia o download automaticamente após carregar
  useEffect(() => {
    if (!carregando && orderData?.downloadUrl) {
      const timer = setTimeout(() => {
        const a = document.createElement('a');
        a.href = orderData.downloadUrl;
        a.download = orderData.pdfFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [carregando, orderData]);

  const isBasic = orderData.plan === 'basic';
  const planTitle = isBasic ? 'PRIME STL Básico' : 'PRIME STL Premium';

  return (
    <div className="w-full max-w-xl bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-white text-center">
      {/* Ícone de Sucesso */}
      <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-3 uppercase tracking-wider">
        Pagamento Confirmado
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        Acesso Liberado com Sucesso!
      </h1>
      <p className="text-slate-300 text-sm mb-6">
        Seu plano <strong className="text-emerald-400 font-semibold">{planTitle}</strong> já está disponível para acesso e download imediato.
      </p>

      {/* ÁREA PRINCIPAL DE ENTREGA */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 mb-6 shadow-xl space-y-4">
        <div>
          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-2xl">
            📄
          </div>
          <h2 className="text-lg font-bold text-white mb-0.5">
            {orderData.pdfFileName}
          </h2>
          <p className="text-xs text-slate-400">
            Contém todos os links exclusivos do Google Drive, modelos organizados e manual de fatiamento.
          </p>
        </div>

        {/* Botão de Download do PDF */}
        <a
          href={orderData.downloadUrl}
          download={orderData.pdfFileName}
          className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-base transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.01] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Baixar Meu Guia em PDF
        </a>


        <p className="text-[11px] text-emerald-400/90 pt-1">
          ✓ O download do PDF começou automaticamente. Se não iniciou, clique no botão acima.
        </p>
      </div>

      {/* Cartão de Detalhes da Compra */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-2.5 text-xs">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <span className="text-slate-400">Plano Adquirido</span>
          <span className="font-semibold text-white">{planTitle}</span>
        </div>

        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <span className="text-slate-400">Status</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Aprovado ({status})
          </span>
        </div>

        {orderId && (
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">ID do Pedido</span>
            <span className="font-mono text-slate-200 truncate max-w-[200px]" title={orderId}>
              {orderId}
            </span>
          </div>
        )}

        {paymentId && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ID Mercado Pago</span>
            <span className="font-mono text-slate-200">{paymentId}</span>
          </div>
        )}
      </div>

      {/* Box de Acesso à Área de Membros */}
      <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 mb-6 text-left text-xs">
        <div className="flex items-center gap-2 mb-1.5 text-blue-400 font-bold">
          <span>Sua Conta de Membro está Liberada!</span>
        </div>
        <p className="text-slate-300 leading-relaxed mb-3">
          Você pode acessar seus arquivos a qualquer momento entrando com o seu <strong>Telefone</strong> e <strong>Senha</strong> cadastrados na compra.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
        >
          Acessar Meu Painel de Membros ➔
        </Link>
      </div>

      {/* Confirmação de Entrega */}
      <div className="text-center text-xs text-slate-400 mb-5">
        <span className="text-emerald-400 font-medium">✓ Pedido demonstrativo validado com sucesso</span>
      </div>

      {/* Ações Secundárias */}
      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all border border-slate-700"
        >
          ← Voltar à Página Principal
        </Link>
      </div>
    </div>
  );
}

export default function PaginaSucesso() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-white text-center animate-pulse">
            Carregando detalhes do pagamento e preparando seus arquivos...
          </div>
        }
      >
        <ConteudoSucesso />
      </Suspense>
    </main>
  );
}
