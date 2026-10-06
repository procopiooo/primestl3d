'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Vercel Best Practice: js-combine-iterations & server-hoist-static-io
function getInitials(name) {
  if (!name) return 'MB';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PainelCliente() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Estados para troca de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [msgSenha, setMsgSenha] = useState(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Carrega dados da sessão
  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setDados(data);
      } catch (err) {
        router.push('/login');
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleTrocarSenha(e) {
    e.preventDefault();
    setMsgSenha(null);

    if (novaSenha !== confirmarSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A nova senha precisa ter no mínimo 6 dígitos.' });
      return;
    }

    setSalvandoSenha(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao alterar senha.');
      }

      setMsgSenha({ tipo: 'sucesso', texto: 'Senha atualizada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err) {
      setMsgSenha({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvandoSenha(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center text-[#101820]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#007fff] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#66717d]">Carregando sua Área de Membros...</p>
        </div>
      </main>
    );
  }

  if (!dados) return null;

  const { cliente, entrega } = dados;
  const iniciais = getInitials(cliente.nome);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#101820] selection:bg-[#007fff] selection:text-white">
      {/* Barra de Navegação Superior Limpa */}
      <header className="h-[76px] border-b border-[#dfe4e9] bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            aria-label="PRIME STL — Voltar à página inicial"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <img
              src="/images/logo.png"
              alt="PRIME STL"
              className="h-8 sm:h-9 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-[#007fff] font-bold flex items-center justify-center text-xs">
                {iniciais}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-sm font-semibold text-[#101820] block leading-tight">{cliente.nome}</span>
                <span className="text-xs text-[#007fff] font-medium">Acesso Vitalício Ativo</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#66717d] hover:text-[#101820] transition-colors border border-[#dfe4e9] font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Banner de Boas-Vindas */}
        <section className="bg-white border border-[#dfe4e9] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(16,24,32,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
                Acesso Liberado
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#101820] tracking-tight">
                Olá, {cliente.nome}
              </h1>
              <p className="text-sm text-[#66717d] mt-1">
                Seu plano <strong className="text-[#101820]">{entrega.planoTitulo}</strong> está disponível para download imediato.
              </p>
            </div>

            <div className="bg-[#f7f8fa] border border-[#dfe4e9] px-4 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#007fff] flex items-center justify-center text-xl font-bold shrink-0">
                📦
              </div>
              <div>
                <span className="text-xs text-[#66717d] block">Total de Modelos</span>
                <span className="text-sm font-bold text-[#101820] block">{entrega.totalModelos}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Card em Destaque: Download do Guia em PDF */}
        <section className="bg-white border border-[#dfe4e9] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(16,24,32,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0 text-[#007fff]">
                📄
              </div>
              <div>
                <span className="text-xs font-semibold text-[#007fff] uppercase tracking-wider block mb-1">
                  Download Principal
                </span>
                <h2 className="text-xl font-bold text-[#101820] tracking-tight mb-1.5">
                  {entrega.pdfFileName}
                </h2>
                <p className="text-sm text-[#66717d] leading-relaxed max-w-xl">
                  Guia digital oficial contendo todos os links diretos das coleções no Google Drive, índice de arquivos organizados e manual com instruções para fatiamento de peças 3D.
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href={entrega.downloadUrl}
                download={entrega.pdfFileName}
                className="inline-flex items-center justify-center gap-2.5 w-full md:w-auto py-3.5 px-6 rounded-xl bg-[#007fff] hover:bg-[#006be0] text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Baixar Guia em PDF</span>
              </a>
            </div>
          </div>
        </section>

        {/* Como Utilizar em 3 Passos */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#dfe4e9] rounded-xl p-5 shadow-sm space-y-1.5">
            <span className="text-xs font-bold text-[#007fff] block">Passo 1</span>
            <h3 className="text-base font-semibold text-[#101820]">Baixe o Guia em PDF</h3>
            <p className="text-xs text-[#66717d] leading-relaxed">
              Clique no botão acima para salvar o PDF no seu celular, tablet ou computador.
            </p>
          </div>

          <div className="bg-white border border-[#dfe4e9] rounded-xl p-5 shadow-sm space-y-1.5">
            <span className="text-xs font-bold text-[#007fff] block">Passo 2</span>
            <h3 className="text-base font-semibold text-[#101820]">Abra os Links Diretos</h3>
            <p className="text-xs text-[#66717d] leading-relaxed">
              Dentro do PDF, cada categoria possui links diretos para visualizar e baixar os arquivos STL.
            </p>
          </div>

          <div className="bg-white border border-[#dfe4e9] rounded-xl p-5 shadow-sm space-y-1.5">
            <span className="text-xs font-bold text-[#007fff] block">Passo 3</span>
            <h3 className="text-base font-semibold text-[#101820]">Fatie e Imprima</h3>
            <p className="text-xs text-[#66717d] leading-relaxed">
              Importe os arquivos no seu fatiador favorito (Cura, Bambu Studio, OrcaSlicer, etc.) e inicie a impressão.
            </p>
          </div>
        </section>

        {/* Alterar Senha */}
        <section className="bg-white border border-[#dfe4e9] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(16,24,32,0.04)] max-w-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#101820]">Segurança da Conta</h3>
            <p className="text-xs text-[#66717d] mt-1">Altere sua senha de acesso quando desejar</p>
          </div>

          {msgSenha ? (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm mb-5 flex items-center gap-2.5 ${
                msgSenha.tipo === 'sucesso'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span className="font-bold">{msgSenha.tipo === 'sucesso' ? '✓' : '!'}</span>
              <span>{msgSenha.texto}</span>
            </div>
          ) : null}

          <form onSubmit={handleTrocarSenha} className="space-y-4">
            <div>
              <label htmlFor="senha-atual-input" className="block text-xs font-semibold text-[#101820] mb-1.5">
                Senha Atual
              </label>
              <input
                id="senha-atual-input"
                type="password"
                required
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full bg-[#fcfdfe] border border-[#dfe4e9] rounded-xl px-3.5 py-2.5 text-sm text-[#101820] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#007fff] focus:ring-3 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="nova-senha-input" className="block text-xs font-semibold text-[#101820] mb-1.5">
                  Nova Senha
                </label>
                <input
                  id="nova-senha-input"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  className="w-full bg-[#fcfdfe] border border-[#dfe4e9] rounded-xl px-3.5 py-2.5 text-sm text-[#101820] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#007fff] focus:ring-3 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmar-senha-input" className="block text-xs font-semibold text-[#101820] mb-1.5">
                  Confirmar Senha
                </label>
                <input
                  id="confirmar-senha-input"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-[#fcfdfe] border border-[#dfe4e9] rounded-xl px-3.5 py-2.5 text-sm text-[#101820] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#007fff] focus:ring-3 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={salvandoSenha}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {salvandoSenha ? 'Atualizando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        </section>

        {/* Canais de Suporte e Contato Oficial */}
        <section className="bg-white border border-[#dfe4e9] rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(16,24,32,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#007fff] uppercase tracking-wider block mb-1">
                Ambiente de Demonstração
              </span>
              <h3 className="text-lg font-bold text-[#101820]">Área do Membro VIP</h3>
              <p className="text-xs text-[#66717d] mt-0.5">
                Acesso aos modelos 3D, guias em PDF e pastas organizadas na nuvem.
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Status: Acesso Liberado
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
