import { isLoginPath, loginPath } from './authRoutes';
import { sessionToken, verifyFirebaseToken } from './firebaseIdentity';

// Only the login entry, its shared styles, and the Firebase SDK are public.
export function isPublicFrontendPath(pathname: string) {
  return isLoginPath(pathname)
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
