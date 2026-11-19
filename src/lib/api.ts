let sessionRequest: Promise<void> | undefined;

/** Keep identity tokens out of localStorage and attach them only to our API. */
export const apiFetch: typeof fetch = async (input, init) => {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(target, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) throw new Error('Invalid API destination');
  const { auth } = await import('./firebase');
  await auth.authStateReady();
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  headers.set('X-DutyDeck-Request', '1');
  if (auth.currentUser) headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
  else {
    sessionRequest ||= fetch('/api/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-DutyDeck-Request': '1' }, body: '{}' }).then(response => {
      if (!response.ok) throw new Error('Could not start a private reading session. Please retry.');
    }).catch(error => { sessionRequest = undefined; throw error; });
    await sessionRequest;
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
};

export async function clearApiSession() {
  sessionRequest = undefined;
  await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin', headers: { 'X-DutyDeck-Request': '1' } });
}
