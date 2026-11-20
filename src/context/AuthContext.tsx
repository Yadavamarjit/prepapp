import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearApiSession } from '../lib/api';

const GUEST_SESSION_KEY = 'dutydeck_guest_session';
const JWT_KEY = 'ncert_jwt';

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isGuest?: boolean;
}

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState & {
  canUseAi: boolean;
  signOutUser: () => Promise<void>;
}>({ user: null, loading: false, canUseAi: false, signOutUser: async () => {} });

function readLegacyGuest(): AppUser | null {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_SESSION_KEY) || 'null');
    if (saved?.isGuest === true && typeof saved.uid === 'string') return saved;
  } catch { /* The browser can still open the workspace without saved storage. */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ user, loading }, setState] = useState<AuthState>(() => ({ user: readLegacyGuest(), loading: true }));

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const finishWithoutAccount = () => {
      if (!disposed) setState({ user: readLegacyGuest(), loading: false });
    };

    void import('../lib/firebase').then(({ auth, onAuthStateChanged }) => {
      if (disposed) return;
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) return finishWithoutAccount();
        setState({
          loading: false,
          user: { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName },
        });
      }, finishWithoutAccount);
    }).catch(finishWithoutAccount);

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  async function signOutUser() {
    await Promise.allSettled([
      import('../lib/firebase').then(({ auth, signOut }) => signOut(auth)),
      clearApiSession(),
    ]);
    try { localStorage.removeItem(JWT_KEY); } catch { /* Storage may be disabled. */ }
  }

  return (
    <AuthContext.Provider value={{ user, loading, canUseAi: !!user && !user.isGuest, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
