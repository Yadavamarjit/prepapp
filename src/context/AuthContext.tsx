import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';

// ── Config ────────────────────────────────────────────────────────────────────
// URL of the ncert-mcp FastAPI backend
const NCERT_API = import.meta.env.VITE_NCERT_API_URL || 'http://localhost:8000';
const JWT_KEY   = 'ncert_jwt';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user:        User | null;
  ncertJwt:    string | null;   // JWT for ncert-mcp API calls
  loading:     boolean;
  signIn:      () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError:   string | null;
  /** Make an authenticated fetch to the ncert-mcp API */
  ncertFetch:  (path: string, init?: RequestInit) => Promise<Response>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user:        null,
  ncertJwt:    null,
  loading:     true,
  signIn:      async () => {},
  signOutUser: async () => {},
  authError:   null,
  ncertFetch:  () => Promise.reject(new Error('AuthProvider not mounted')),
});

// ── Exchange Firebase ID token → ncert-mcp JWT ────────────────────────────────
async function exchangeForNcertJwt(firebaseUser: User): Promise<string | null> {
  try {
    const idToken = await firebaseUser.getIdToken(/* forceRefresh */ false);
    const res = await fetch(`${NCERT_API}/auth/google/firebase`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id_token: idToken }),
    });
    if (!res.ok) {
      console.warn('[ncert-auth] token exchange failed', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.access_token as string;
  } catch (err) {
    console.warn('[ncert-auth] token exchange error:', err);
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,     setUser]     = useState<User | null>(null);
  const [ncertJwt, setNcertJwt] = useState<string | null>(
    () => localStorage.getItem(JWT_KEY)
  );
  const [loading,   setLoading]   = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Firebase auth state listener ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // If we don't have a JWT yet (or it's stale), exchange for one
        const stored = localStorage.getItem(JWT_KEY);
        if (!stored) {
          const jwt = await exchangeForNcertJwt(currentUser);
          if (jwt) {
            localStorage.setItem(JWT_KEY, jwt);
            setNcertJwt(jwt);
          }
        } else {
          setNcertJwt(stored);
        }
      } else {
        // Signed out — clear JWT
        localStorage.removeItem(JWT_KEY);
        setNcertJwt(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Sign In ───────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const firebaseUser = await signInWithGoogle();

      // Immediately exchange for ncert-mcp JWT after popup succeeds
      const jwt = await exchangeForNcertJwt(firebaseUser);
      if (jwt) {
        localStorage.setItem(JWT_KEY, jwt);
        setNcertJwt(jwt);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      setAuthError(err?.message || 'Google sign-in could not be completed.');
    }
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await logOut();
      // Also tell the backend (best-effort, JWT is stateless)
      const jwt = localStorage.getItem(JWT_KEY);
      if (jwt) {
        fetch(`${NCERT_API}/auth/logout`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${jwt}` },
        }).catch(() => {});
      }
      localStorage.removeItem(JWT_KEY);
      setNcertJwt(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // ── ncertFetch helper — auto-attaches Bearer JWT ──────────────────────────
  const ncertFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const jwt = localStorage.getItem(JWT_KEY);
      if (!jwt) throw new Error('Not authenticated. Please sign in first.');

      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${jwt}`);

      const res = await fetch(`${NCERT_API}${path}`, { ...init, headers });

      // If JWT expired, try to refresh once and retry
      if (res.status === 401 && user) {
        const fresh = await exchangeForNcertJwt(user);
        if (fresh) {
          localStorage.setItem(JWT_KEY, fresh);
          setNcertJwt(fresh);
          headers.set('Authorization', `Bearer ${fresh}`);
          return fetch(`${NCERT_API}${path}`, { ...init, headers });
        }
      }

      return res;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        ncertJwt,
        loading,
        signIn:      handleSignIn,
        signOutUser: handleSignOut,
        authError,
        ncertFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
