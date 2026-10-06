import { MercadoPagoConfig } from 'mercadopago';

const mpToken = process.env.MP_ACCESS_TOKEN;

export const isMercadoPagoConfigured = Boolean(
  mpToken &&
  (mpToken.startsWith('TEST-') || mpToken.startsWith('APP_USR-')) &&
  !mpToken.includes('DEMO') &&
  !mpToken.includes('placeholder')
);

if (!isMercadoPagoConfigured) {
  console.log('[MERCADO PAGO] Modo Apresentação / Portfólio ativo (sem token real de gateway).');
}

/**
 * Instância do cliente Mercado Pago SDK v2
 */
export const mpClient = new MercadoPagoConfig({
  accessToken: isMercadoPagoConfigured ? mpToken : 'TEST-DEMO-PORTFOLIO-PRESENTATION-TOKEN',
  options: {
    timeout: 7000,
    idempotencyKey: 'mp-session-' + Date.now(),
  },
});
