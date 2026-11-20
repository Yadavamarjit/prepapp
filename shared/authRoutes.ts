export function loginPath(destination: string) {
  return '/login?' + new URLSearchParams({ next: destination });
}

export function isLoginPath(pathname: string) {
  return pathname === '/login' || pathname === '/login/';
}

export function afterLogin(raw: string | null) {
  if (!raw?.startsWith('/') || raw.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(raw)) return '/';
  const origin = 'https://cadetslate.invalid';
  const url = new URL(raw, origin);
  if (url.origin !== origin || /^\/(?:login|api|assets)(?:\/|$)/i.test(url.pathname)) return '/';
  return url.pathname + url.search + url.hash;
}
