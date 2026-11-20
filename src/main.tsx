import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { isLoginPath, loginPath } from '../shared/authRoutes';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const StudyApp = lazy(() => import('./App'));

function LoadingWorkspace() {
  return <main className="grid min-h-dvh place-items-center p-5" role="status">Opening CadetSlate…</main>;
}

function Entry() {
  const { pathname, search, hash } = useLocation();
  const { user, loading } = useAuth();

  if (pathname === '/') return <HomePage />;
  if (isLoginPath(pathname)) return <LoginPage />;
  if (loading) return <LoadingWorkspace />;
  if (!user) return <Navigate to={loginPath(pathname + search + hash)} replace />;

  return <Suspense fallback={<LoadingWorkspace />}><StudyApp /></Suspense>;
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider><Entry /></AuthProvider>
  </BrowserRouter>
);
