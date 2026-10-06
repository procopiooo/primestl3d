'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConteudoFalha() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const status = searchParams.get('status') || searchParams.get('collection_status') || 'rejected';
  const orderId = searchParams.get('external_reference');

  return (
    <div className="w-full max-w-xl bg-slate-900/90 border border-rose-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-white text-center">
      {/* Ícone de Falha */}
      <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-3 uppercase tracking-wider">
        Transação Não Aprovada
      </span>

      <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
        Houve um problema com seu pagamento
      </h1>
      <p className="text-slate-400 text-sm md:text-base mb-6">
        Não foi possível processar a cobrança no momento. Nenhuma taxa foi cobrada da sua conta.
      </p>

      {/* Cartão Informativo */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 mb-6 text-left space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
          <span className="text-slate-400">Status</span>
          <span className="font-semibold text-rose-400 capitalize">Recusado ({status})</span>
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
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Código da Tentativa</span>
            <span className="font-mono text-slate-200 text-xs">{paymentId}</span>
          </div>
        )}
      </div>

      {/* Motivos mais comuns */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 mb-6 text-left text-xs text-slate-400 space-y-1.5">
        <span className="font-semibold text-slate-300 block mb-1">Motivos mais comuns:</span>
        <p>• Dados do cartão digitados incorretamente (validade, CVV ou número).</p>
        <p>• Limite insuficiente ou bloqueio preventivo da operadora de cartão.</p>
        <p>• Instabilidade temporária no banco emissor ou gateway.</p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700 hover:border-slate-600"
        >
          Voltar à Página Principal
        </Link>
        <Link
          href="/#planos"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/20"
        >
          Tentar Novamente
        </Link>
      </div>
    </div>
  );
}

export default function PaginaFalha() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-white text-center animate-pulse">
            Carregando informações...
          </div>
        }
      >
        <ConteudoFalha />
      </Suspense>
    </main>
  );
}
