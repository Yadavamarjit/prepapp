import { next } from '@vercel/functions';
import { PRIVATE_CACHE } from './shared/firebaseIdentity';
import { isLoginPath } from './shared/authRoutes';
import { pageAccess } from './shared/pageAccess';

export default async function proxy(request: Request) {
  const url = new URL(request.url);
  // Express checks every private API request, including calls to its own hostname.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return next();

  const access = await pageAccess(url, request.headers.get('cookie'), true);
  const headers = new Headers({ 'Cache-Control': PRIVATE_CACHE, 'X-Robots-Tag': 'noindex, nofollow' });
  if ('denied' in access) {
    if (access.location) headers.set('Location', access.location);
    return new Response(access.denied === 401 ? 'Sign in required.' : null, { status: access.denied, headers });
  }

  if (!access.public || isLoginPath(url.pathname)) return next({ headers });
  return next();
}
