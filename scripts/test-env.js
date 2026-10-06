import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

console.log('\n===========================================');
console.log('🔍 TESTE DE DIAGNÓSTICO DO AMBIENTE LOCAL');
console.log('===========================================\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local NÃO encontrado na raiz!');
  console.error('👉 Crie o arquivo .env.local baseado no .env.example com suas chaves reais.\n');
  process.exit(1);
}

// Carrega variáveis manualmente para garantir compatibilidade
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...values] = trimmed.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

const mpToken = process.env.MP_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

console.log('1. Verificando Variáveis de Ambiente:');
console.log(`   • NEXT_PUBLIC_APP_URL: ${appUrl ? '✅ ' + appUrl : '❌ Não configurado'}`);
console.log(`   • MP_ACCESS_TOKEN: ${mpToken ? (mpToken.startsWith('TEST-') ? '✅ Configurado (Modo Sandbox/Teste)' : '⚠️ Configurado (Modo Produção)') : '❌ Não configurado'}`);
console.log(`   • SUPABASE_URL: ${supabaseUrl ? '✅ ' + supabaseUrl : '❌ Não configurado'}`);
console.log(`   • SUPABASE_KEY: ${supabaseKey ? '✅ Configurado' : '❌ Não configurado'}\n`);

if (!mpToken || !supabaseUrl || !supabaseKey) {
  console.log('ℹ️ O projeto está operando em MODO APRESENTAÇÃO / PORTFÓLIO.');
  console.log('   (O site funciona de forma demonstrativa com checkout e painel simulados).\n');
  process.exit(0);
}

async function testConnections() {
  console.log('2. Testando Comunicação com o Supabase:');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('pedidos').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.error('   ❌ A tabela "pedidos" ainda não foi criada no Supabase!');
        console.log('   👉 Execute o arquivo supabase_schema.sql no SQL Editor do Supabase.\n');
      } else {
        console.error('   ❌ Erro ao conectar ao Supabase:', error.message);
      }
    } else {
      console.log('   ✅ Conexão com a tabela "pedidos" no Supabase realizada com sucesso!\n');
    }
  } catch (err) {
    console.error('   ❌ Erro no cliente Supabase:', err.message);
  }

  console.log('3. Testando Comunicação com o Mercado Pago:');
  try {
    const { MercadoPagoConfig, Preference } = await import('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: mpToken });
    const preference = new Preference(client);

    const testPref = await preference.create({
      body: {
        items: [
          {
            id: 'teste-diagnostico',
            title: 'Item de Teste de Diagnostico',
            quantity: 1,
            unit_price: 10.0,
            currency_id: 'BRL',
          },
        ],
      },
    });

    if (testPref?.id && testPref?.init_point) {
      console.log('   ✅ Conexão com a API do Mercado Pago validada com sucesso!');
      console.log(`   🔗 ID da Preferência Gerada: ${testPref.id}`);
      console.log(`   🔗 URL de Pagamento de Teste: ${testPref.init_point}\n`);
    } else {
      console.error('   ❌ Resposta inesperada do Mercado Pago ao criar preferência.');
    }
  } catch (err) {
    console.error('   ❌ Erro ao chamar API do Mercado Pago:', err.message);
    if (err.message?.includes('token') || err.status === 401) {
      console.log('   👉 Verifique se o seu MP_ACCESS_TOKEN está correto no .env.local.');
    }
  }

  console.log('===========================================');
  console.log('🏁 Diagnóstico concluído!');
  console.log('===========================================\n');
}

testConnections();
