export const metadata = {
  title: 'PRIME STL — Checkout & Pagamentos',
  description: 'Ambiente de testes para pagamentos via Mercado Pago e Supabase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
