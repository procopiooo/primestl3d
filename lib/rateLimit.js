// In-memory sliding-window rate limiter para proteger rotas críticas contra ataques de força bruta
const rateLimitMap = new Map();

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Verifica e aplica rate limit para uma chave (IP, telefone, rota)
 * @param {string} key Identificador único
 * @param {number} maxAttempts Quantidade máxima de tentativas permitidas na janela
 * @param {number} windowMs Janela de tempo em milissegundos
 * @returns {{ success: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 5 * 60 * 1000) {
  cleanup();
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: maxAttempts - record.count,
    resetInSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
  };
}

/**
 * Reseta o contador para uma chave específica (ex: ao autenticar com sucesso)
 */
export function resetRateLimit(key) {
  rateLimitMap.delete(key);
}
