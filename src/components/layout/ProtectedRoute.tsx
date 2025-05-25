'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { loading, isAuthenticated } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
} 