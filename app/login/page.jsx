'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Vercel Best Practice: js-hoist-regexp
const DIGITS_ONLY_REGEX = /\D/g;
const PHONE_10_REGEX = /(\d{2})(\d{4})(\d{0,4})/;
const PHONE_11_REGEX = /(\d{2})(\d{5})(\d{0,4})/;

function formatarTelefone(valor) {
  const limpo = valor.replace(DIGITS_ONLY_REGEX, '').slice(0, 11);
  if (limpo.length <= 10) {
    return limpo.replace(PHONE_10_REGEX, '($1) $2-$3').trim();
  }
  return limpo.replace(PHONE_11_REGEX, '($1) $2-$3').trim();
}

export default function PaginaLogin() {
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone,
          senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      router.push('/painel');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#101820] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#007fff] selection:text-white">
      <div className="w-full max-w-md">
        {/* Card Principal - Design Limpo, Humano e de Alta Fidelidade */}
        <div className="bg-white border border-[#dfe4e9] rounded-2xl p-8 sm:p-10 shadow-[0_10px_30px_rgba(16,24,32,0.06)]">
          {/* Logo e Área de Membros VIP 100% Centralizados */}
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <Link
              href="/"
              aria-label="PRIME STL — Voltar à página inicial"
              className="inline-block transition-opacity hover:opacity-90 mb-4"
            >
              <img
                src="/images/logo.png"
                alt="PRIME STL"
                className="h-10 sm:h-11 w-auto mx-auto block"
              />
            </Link>

            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#007fff] border border-blue-100 text-xs font-semibold mb-2">
              Área de Membros VIP
            </span>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101820]">
              Entrar na sua conta
            </h1>
            <p className="text-sm text-[#66717d] mt-1.5">
              Informe o telefone e senha definidos na compra
            </p>
            <div className="mt-3 py-1.5 px-3 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-[#007fff] flex items-center justify-center gap-1.5">
              <span>💡</span>
              <span><strong>Modo Apresentação:</strong> Você pode testar com qualquer telefone e senha.</span>
            </div>
          </div>

          {/* Alerta de Erro - rendering-conditional-render */}
          {erro ? (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <span className="font-bold text-red-500 leading-none">!</span>
              <span className="leading-snug">{erro}</span>
            </div>
          ) : null}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="telefone-input" className="block text-xs font-semibold text-[#101820] mb-1.5">
                WhatsApp / Telefone com DDD
              </label>
              <input
                id="telefone-input"
                type="text"
                required
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className="w-full bg-[#fcfdfe] border border-[#dfe4e9] rounded-xl px-4 py-3 text-sm text-[#101820] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#007fff] focus:ring-3 focus:ring-blue-100 transition-all font-mono"
              />
            </div>

            <div>
              <label htmlFor="senha-input" className="block text-xs font-semibold text-[#101820] mb-1.5">
                Sua senha de acesso
              </label>
              <div className="relative">
                <input
                  id="senha-input"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-[#fcfdfe] border border-[#dfe4e9] rounded-xl pl-4 pr-14 py-3 text-sm text-[#101820] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#007fff] focus:ring-3 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#66717d] hover:text-[#101820] px-2 py-1 rounded transition-colors"
                >
                  {mostrarSenha ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#007fff] hover:bg-[#006be0] text-white font-semibold text-sm sm:text-base transition-colors shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Acessar minha biblioteca</span>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-8 pt-5 border-t border-[#dfe4e9] text-center space-y-2">
            <p className="text-xs text-[#66717d]">
              Ainda não tem acesso?{' '}
              <Link href="/#planos" className="text-[#007fff] hover:text-[#006be0] font-semibold transition-colors">
                Conhecer os planos disponíveis
              </Link>
            </p>
          </div>
        </div>

        {/* Voltar ao Início */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-[#66717d] hover:text-[#101820] transition-colors inline-flex items-center gap-1.5"
          >
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
