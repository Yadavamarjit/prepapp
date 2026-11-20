import { isLoginPath, loginPath } from './authRoutes.js';
import { sessionToken, verifyFirebaseToken } from './firebaseIdentity.js';

// Keep the landing page, sign-in, and their required assets separate from the study app.
export function isPublicFrontendPath(pathname: string) {
  return pathname === '/' || isLoginPath(pathname)
    || pathname === '/capf-study-hero.webp'
    || pathname === '/capf-study-hero-mobile.webp'
    || /^\/assets\/(?:site-entry|firebase)-[\w-]+\.js$/.test(pathname)
    || /^\/assets\/index-[\w-]+\.css$/.test(pathname);
}

export async function pageAccess(url: URL, cookies: string | null | undefined, secure: boolean, verify = verifyFirebaseToken) {
  if (isPublicFrontendPath(url.pathname)) return { public: true } as const;

  try {
    await verify(sessionToken(cookies, secure));
    return { public: false } as const;
  } catch {
    if (url.pathname.startsWith('/assets/') || /\.(?!html$)[a-z\d]+$/i.test(url.pathname)) {
      return { denied: 401 } as const;
    }
    return { denied: 302, location: loginPath(url.pathname + url.search) } as const;
  }
}
