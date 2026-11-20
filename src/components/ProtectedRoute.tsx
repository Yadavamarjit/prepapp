import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../data/brand';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] dark:bg-[#121816] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#36624B]/10 dark:bg-[#1A2E24] flex items-center justify-center text-[#36624B] dark:text-[#88D4A8] mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#36624B] border-t-transparent animate-spin" />
          <h3 className="font-semibold text-sm text-[#1E252B] dark:text-white font-sans">
            Opening your workspace…
          </h3>
        </div>
        <p className="text-xs text-[#5C646B] dark:text-slate-400 mt-2 font-mono">
          {APP_NAME}
        </p>
      </div>
    );
  }

  // Without login, access to pages is strictly prohibited
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
