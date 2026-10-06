'use client';

import { useState } from 'react';

export default function PaginaTeste() {
  const [plano, setPlano] = useState('premium');
  const [nome, setNome] = useState('Comprador de Teste');
  const [telefone, setTelefone] = useState('(11) 99888-7777');
  const [senha, setSenha] = useState('teste123');
  const [email, setEmail] = useState('comprador.teste@testuser.com');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  async function handleCheckout(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plano,
          payer: {
            name: nome,
            email: email,
            telefone: telefone,
            senha: senha,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar o checkout');
      }

      setResultado(data);

      // Redireciona automaticamente para o Mercado Pago após 1.5s
      const checkoutUrl = data.init_point || data.sandbox_init_point;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
            🧪
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Ambiente de Teste — Checkout</h1>
            <p className="text-xs text-slate-400">Simule compras integradas ao Mercado Pago e Supabase</p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Seleção do Plano */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecione o Plano:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  plano === 'basic'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Plano Básico</span>
                  <input
                    type="radio"
                    name="plano"
                    value="basic"
                    checked={plano === 'basic'}
                    onChange={() => setPlano('basic')}
                    className="accent-blue-500"
                  />
                </div>
                <span className="text-2xl font-bold text-blue-400 mt-2">R$ 9,90</span>
                <span className="text-xs text-slate-400 mt-1">1.000 Modelos STL</span>
              </label>

              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  plano === 'premium'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Plano Premium</span>
                  <input
                    type="radio"
                    name="plano"
                    value="premium"
                    checked={plano === 'premium'}
                    onChange={() => setPlano('premium')}
                    className="accent-emerald-500"
                  />
                </div>
                <span className="text-2xl font-bold text-emerald-400 mt-2">R$ 37,90</span>
                <span className="text-xs text-slate-400 mt-1">150.000+ STL + 14 Coleções</span>
              </label>
            </div>
          </div>

          {/* Dados do Comprador Fictício */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300">Dados do Comprador de Teste:</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">WhatsApp / Telefone (Login)</label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Senha de Acesso (Login)</label>
                <input
                  type="text"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <strong>Erro:</strong> {erro}
            </div>
          )}

          {/* Mensagem de Sucesso */}
          {resultado && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <strong>Sucesso!</strong> Pedido #{resultado.order_id} gravado no Supabase. Redirecionando para o Mercado Pago...
            </div>
          )}

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {carregando ? 'Processando com Supabase e Mercado Pago...' : 'Iniciar Checkout de Teste ➔'}
          </button>
        </form>
      </div>
    </main>
  );
}
