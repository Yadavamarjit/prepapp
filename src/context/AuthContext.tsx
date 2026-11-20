import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { clearApiSession, openApiSession } from '../lib/api';

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string;
}

const signedOut = { user: null, loading: false, error: '' };
const AuthContext = createContext<AuthState & {
  canUseAi: boolean;
  signOutUser: () => Promise<void>;
}>({ ...signedOut, canUseAi: false, signOutUser: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...signedOut, loading: true });
  const sessionWrites = useRef(Promise.resolve());
  const revision = useRef(0);
  const signingOut = useRef(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void import('../lib/firebase').then(({ auth, onIdTokenChanged }) => {
      if (disposed) return;
      const unsubscribe = onIdTokenChanged(auth, (account) => {
        const version = ++revision.current;
        if (!account) {
          setState(signedOut);
          return;
        }

        const isCurrent = () => !disposed && !signingOut.current && version === revision.current;
        sessionWrites.current = sessionWrites.current.then(async () => {
          if (!isCurrent()) return;
          try {
            const token = await account.getIdToken();
            if (!isCurrent()) return;
            await openApiSession(token);
            if (isCurrent()) setState({
              loading: false,
              error: '',
              user: { uid: account.uid, email: account.email, displayName: account.displayName },
            });
          } catch {
            if (isCurrent()) setState(previous => ({
              ...previous, loading: false, error: 'Could not start a secure session. Try signing in again.',
            }));
          }
        });
      }, () => { if (!disposed) setState(signedOut); });

      // Asking for the token near expiration triggers Firebase's refresh listener.
      const refresh = () => { void auth.currentUser?.getIdToken().catch(() => {}); };
      const timer = window.setInterval(refresh, 60_000);
      window.addEventListener('focus', refresh);
      cleanup = () => {
        unsubscribe();
        window.clearInterval(timer);
        window.removeEventListener('focus', refresh);
      };
    }).catch(() => { if (!disposed) setState(signedOut); });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  async function signOutUser() {
    if (signingOut.current) return;
    signingOut.current = true;
    revision.current++;
    try {
      await sessionWrites.current;
      await clearApiSession();
      const { auth, signOut } = await import('../lib/firebase');
      await signOut(auth);
      try { localStorage.removeItem('ncert_jwt'); } catch { /* Storage may be disabled. */ }
      window.location.replace('/login');
    } catch {
      setState(previous => ({ ...previous, error: 'Could not sign out. Please try again.' }));
    } finally {
      signingOut.current = false;
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, canUseAi: !!state.user, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
