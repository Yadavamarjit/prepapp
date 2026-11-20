import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import firebaseConfig from '../firebase-applet-config.json';

export const FIREBASE_PROJECT = firebaseConfig.projectId;
export const PRIVATE_CACHE = 'private, no-store';
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export function sessionCookieName(secure: boolean) {
  return secure ? '__Host-cadetslate-session' : 'cadetslate-session';
}

const tokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function bearerToken(header: string | undefined) {
  return header?.startsWith('Bearer ') ? header.slice(7) : '';
}

export function sessionToken(header: string | null | undefined, secure: boolean) {
  const name = sessionCookieName(secure) + '=';
  return header?.split(';').map(item => item.trim()).find(item => item.startsWith(name))?.slice(name.length) ?? '';
}

export async function verifyFirebaseToken(token: string, project = FIREBASE_PROJECT, keys: JWTVerifyGetKey = googleKeys) {
  if (token.length > 3800 || !tokenPattern.test(token)) throw new Error('Invalid token');
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ['RS256'], audience: project, issuer: `https://securetoken.google.com/${project}`,
    requiredClaims: ['exp', 'iat', 'auth_time', 'sub'],
  });
  const now = Date.now() / 1000;
  if (!payload.sub || payload.sub.length > 128 || typeof payload.exp !== 'number'
      || typeof payload.iat !== 'number' || payload.iat > now + 5
      || typeof payload.auth_time !== 'number' || payload.auth_time < 0 || payload.auth_time > now + 5) {
    throw new Error('Invalid identity');
  }
  if ((payload.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider !== 'google.com' || payload.email_verified !== true) {
    throw new Error('Google sign-in is required');
  }
  return { uid: payload.sub, expiresAt: payload.exp * 1000 };
}
