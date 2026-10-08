import crypto from 'crypto';

// Segredo para assinatura de sessão (usa variável de ambiente ou segredo criptográfico seguro de 256 bits)
const SESSION_SECRET = process.env.SESSION_SECRET || 'b0f4809d66957ca38339decd50c81830ccb46b6221afd8fbadfd442e6ce7401b';

/**
 * Gera um hash seguro para a senha com salt aleatório
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha fornecida confere com o hash armazenado
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hashToVerify, 'hex'));
}

/**
 * Cria um token de sessão assinado contendo os dados essenciais do usuário
 */
export function createSessionToken(user) {
  const payload = {
    id: user.id,
    telefone: user.telefone,
    nome: user.nome,
    plano: user.plano,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 dias de validade
  };

  const payloadString = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadString)
    .digest('base64url');

  return `${payloadString}.${signature}`;
}

/**
 * Valida o token de sessão e retorna os dados do usuário autenticado
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payloadString, signature] = token.split('.');
  if (!payloadString || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadString)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadString, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Sessão expirada
    }
    return payload;
  } catch {
    return null;
  }
}

