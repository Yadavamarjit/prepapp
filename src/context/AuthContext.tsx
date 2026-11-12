import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../lib/firebase';

// ── Config ────────────────────────────────────────────────────────────────────
// URL of the ncert-mcp FastAPI backend
const NCERT_API = import.meta.env.VITE_NCERT_API_URL || 'http://localhost:8000';
const JWT_KEY   = 'ncert_jwt';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

interface AuthContextType {
  user:        AppUser | null;
  ncertJwt:    string | null;   // JWT for ncert-mcp API calls
  loading:     boolean;
  signIn:      () => Promise<void>;
  signInAsGuest: (name?: string, email?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  authError:   string | null;
  clearAuthError: () => void;
  /** Make an authenticated fetch to the ncert-mcp API */
  ncertFetch:  (path: string, init?: RequestInit) => Promise<Response>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user:        null,
  ncertJwt:    null,
  loading:     true,
  signIn:      async () => {},
  signInAsGuest: async () => {},
  signOutUser: async () => {},
  authError:   null,
  clearAuthError: () => {},
  ncertFetch:  () => Promise.reject(new Error('AuthProvider not mounted')),
});

const GUEST_SESSION_KEY = 'dutydeck_guest_session';

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
      return null;
    }
    const data = await res.json();
    return data.access_token as string;
  } catch (err) {
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ncertJwt, setNcertJwt] = useState<string | null>(
    () => localStorage.getItem(JWT_KEY)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Firebase auth state listener & guest session check ────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Real authenticated Firebase user
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isGuest: false,
        };
        setUser(appUser);
        localStorage.removeItem(GUEST_SESSION_KEY);

        // Optional exchange for ncert token
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
        setLoading(false);
      } else {
        // Check if there is an active guest officer session
        const storedGuest = localStorage.getItem(GUEST_SESSION_KEY);
        if (storedGuest) {
          try {
            const parsed = JSON.parse(storedGuest);
            if (parsed?.uid) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        // Signed out — clear user & JWT
        setUser(null);
        localStorage.removeItem(JWT_KEY);
        setNcertJwt(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Sign In with Google ───────────────────────────────────────────────────
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const firebaseUser = await signInWithGoogle();
      const appUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isGuest: false,
      };
      setUser(appUser);
      localStorage.removeItem(GUEST_SESSION_KEY);

      const jwt = await exchangeForNcertJwt(firebaseUser);
      if (jwt) {
        localStorage.setItem(JWT_KEY, jwt);
        setNcertJwt(jwt);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      if (err?.code === 'auth/cancelled-popup-request') return;
      console.warn('Firebase Sign-In warning:', err);
      setAuthError(err?.message || 'Google sign-in could not be completed. You can also sign in with Officer Demo Pass.');
    }
  };

  // ── Instant Officer / Guest Sign In ──────────────────────────────────────
  const handleSignInAsGuest = async (
    name: string = 'Officer Cadet (Aspirant)',
    email: string = 'cadet.aspirant@dutydeck.upsc.gov.in'
  ) => {
    setAuthError(null);
    const guestUser: AppUser = {
      uid: `officer-${Date.now().toString(36)}`,
      email,
      displayName: name,
      photoURL: null,
      isGuest: true,
    };
    try {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
    } catch (e) {
      console.error('Failed to store guest session:', e);
    }
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await logOut().catch(() => {});
      localStorage.removeItem(GUEST_SESSION_KEY);
      const jwt = localStorage.getItem(JWT_KEY);
      if (jwt) {
        fetch(`${NCERT_API}/auth/logout`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${jwt}` },
        }).catch(() => {});
      }
      localStorage.removeItem(JWT_KEY);
      setNcertJwt(null);
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      localStorage.removeItem(GUEST_SESSION_KEY);
      setUser(null);
    }
  };

  // ── ncertFetch helper ─────────────────────────────────────────────────────
  const ncertFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const jwt = localStorage.getItem(JWT_KEY);
      if (!jwt) throw new Error('Not authenticated. Please sign in first.');

      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${jwt}`);

      const res = await fetch(`${NCERT_API}${path}`, { ...init, headers });
      return res;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        ncertJwt,
        loading,
        signIn:        handleSignIn,
        signInAsGuest: handleSignInAsGuest,
        signOutUser:   handleSignOut,
        authError,
        clearAuthError: () => setAuthError(null),
        ncertFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
