'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConteudoPendente() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const status = searchParams.get('status') || searchParams.get('collection_status') || 'pending';
  const orderId = searchParams.get('external_reference');
  const paymentType = searchParams.get('payment_type');

  return (
    <div className="w-full max-w-xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-white text-center">
      {/* Ícone de Pendente */}
      <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
        <svg
          className="w-10 h-10 animate-spin"
          style={{ animationDuration: '6s' }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-3 uppercase tracking-wider">
        Processamento em Andamento
      </span>

      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        Aguardando Confirmação
      </h1>
      <p className="text-slate-400 text-sm md:text-base mb-6">
        Seu pagamento está sendo analisado ou aguarda compensação bancária (PIX ou Boleto).
      </p>

      {/* Cartão Informativo */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 mb-6 text-left space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
          <span className="text-slate-400">Status</span>
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Aguardando ({status})
          </span>
        </div>

        {orderId && (
          <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">ID do Pedido</span>
            <span className="font-mono text-slate-200 text-xs truncate max-w-[200px]" title={orderId}>
              {orderId}
            </span>
          </div>
        )}

        {paymentId && (
          <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Código de Referência</span>
            <span className="font-mono text-slate-200 text-xs">{paymentId}</span>
          </div>
        )}

        {paymentType && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Meio Utilizado</span>
            <span className="capitalize text-slate-200">{paymentType.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-6 text-left text-xs text-amber-200/90 leading-relaxed">
        <strong>O que você deve fazer?</strong>
        <p className="mt-1">
          • Se você pagou via <strong>PIX</strong>, a compensação costuma levar até 2 minutos.<br />
          • Se optou por <strong>Boleto</strong>, a confirmação pode levar de 1 a 3 dias úteis.<br />
          Assim que for confirmado, nosso sistema liberará seu acesso e enviará um e-mail automaticamente.
        </p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700 hover:border-slate-600"
        >
          Voltar à Loja
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          Atualizar Status
        </button>
      </div>
    </div>
  );
}

export default function PaginaPendente() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-white text-center animate-pulse">
            Consultando andamento do pagamento...
          </div>
        }
      >
        <ConteudoPendente />
      </Suspense>
    </main>
  );
}
