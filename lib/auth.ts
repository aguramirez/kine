import jwt, { SignOptions } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'kineapp_secret_fallback_12345';

export function signJwt(payload: object, expiresIn: SignOptions['expiresIn'] = '1d') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}
