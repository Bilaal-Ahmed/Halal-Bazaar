import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'buyer' | 'seller' | 'admin' }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading your account…</div>;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return <div className="min-h-[60vh] flex items-center justify-center text-center text-muted-foreground px-4">Your account profile is unavailable. Sign out and sign in again, or contact support.</div>;
  }

  const isLegacyAdmin = role === 'admin'
    && user.emailVerified
    && user.email?.toLowerCase() === 'ba341914@gmail.com';
  if (role && profile.role !== role && !isLegacyAdmin) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role && profile.status !== 'approved') {
    return <div className="min-h-[60vh] flex items-center justify-center text-center text-muted-foreground px-4">This account is not active for protected marketplace operations.</div>;
  }

  return <>{children}</>;
}
