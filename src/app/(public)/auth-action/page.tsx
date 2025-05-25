'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function AuthActionContent() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithMagicLink } = useAuth();

  useEffect(() => {
    const handleAuthAction = async () => {
      try {
        const mode = searchParams?.get('mode');
        const oobCode = searchParams?.get('oobCode');
        const continueUrl = searchParams?.get('continueUrl');
        
        console.log('Auth action parameters:', {
          mode,
          oobCode: oobCode ? 'present' : 'missing',
          continueUrl
        });

        if (mode === 'signIn' && oobCode) {
          console.log('Processing magic link sign-in...');
          setMessage('Signing you in...');
          
          const currentUrl = window.location.href;
          const user = await signInWithMagicLink(currentUrl);
          
          console.log('Magic link sign-in successful:', user.email);
          setStatus('success');
          setMessage('Successfully signed in! Redirecting...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          
        } else {
          console.error('Invalid auth action parameters');
          setStatus('error');
          setMessage('Invalid authentication link. Please try signing in again.');
        }
        
      } catch (error) {
        console.error('Auth action error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try signing in again.');
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthAction();
  }, [searchParams, signInWithMagicLink, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Processing...
              </h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-green-600">
                Success!
              </h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-red-600">
                Error
              </h2>
            </>
          )}
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
} 