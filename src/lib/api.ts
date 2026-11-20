/** Attach Firebase credentials only to same-origin API requests. */
export const apiFetch: typeof fetch = async (input, init) => {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(target, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) throw new Error('Invalid API destination');
  const { auth } = await import('./firebase');
  await auth.authStateReady();
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  headers.set('X-DutyDeck-Request', '1');
  if (auth.currentUser) headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
};

export async function openApiSession(token: string) {
  const response = await fetch('/api/session', {
    method: 'POST',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-DutyDeck-Request': '1' },
    body: '{}',
  });
  if (!response.ok || (await response.json()).authenticated !== true) throw new Error('Secure session unavailable');
}

export async function clearApiSession() {
  const response = await fetch('/api/session', {
    method: 'DELETE', credentials: 'same-origin', signal: AbortSignal.timeout(12000), headers: { 'X-DutyDeck-Request': '1' },
  });
  if (!response.ok) throw new Error('Could not close the secure session');
}
