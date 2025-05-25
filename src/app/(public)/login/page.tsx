'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isMagicLink } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isProcessingMagicLink, setIsProcessingMagicLink] = useState(false);
  
  const { user, sendMagicLink, signInWithMagicLink } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle magic link on page load
  useEffect(() => {
    const handleMagicLink = async () => {
      const currentUrl = window.location.href;
      console.log('Current URL:', currentUrl);
      console.log('Window location:', window.location);
      
      // Check URL parameters for magic link indicators
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const oobCode = urlParams.get('oobCode');
      const apiKey = urlParams.get('apiKey');
      const continueUrl = urlParams.get('continueUrl');
      
      console.log('URL parameters:', {
        mode,
        oobCode: oobCode ? 'present' : 'missing',
        apiKey: apiKey ? 'present' : 'missing',
        continueUrl
      });
      
      // Check if this is a magic link from Firebase Auth
      const isMagicLinkUrl = isMagicLink(currentUrl) || (mode === 'signIn' && oobCode);
      console.log('Is magic link?', isMagicLinkUrl);
      
      if (isMagicLinkUrl) {
        console.log('Processing magic link...');
        setIsProcessingMagicLink(true);
        
        try {
          // If we're on the Firebase Auth domain, we need to handle the redirect
          if (window.location.hostname.includes('firebaseapp.com')) {
            console.log('Magic link from Firebase Auth domain detected');
            // The magic link processing should happen automatically
            // Firebase will redirect to the continueUrl after processing
            return;
          }
          
          const user = await signInWithMagicLink(currentUrl);
          console.log('Magic link sign-in successful:', user);
          setMessage('Successfully signed in! Redirecting...');
          
          // Small delay to show success message
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          
        } catch (error) {
          console.error('Magic link sign-in error:', error);
          setError('Failed to sign in with magic link. Please try again.');
        } finally {
          setIsProcessingMagicLink(false);
        }
      }
    };

    handleMagicLink();
  }, [signInWithMagicLink, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await sendMagicLink(email);
      setMessage('Magic link sent! Check your email and click the link to sign in.');
      setEmail('');
         } catch (error) {
       console.error('Send magic link error:', error);
       setError(error instanceof Error ? error.message : 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isProcessingMagicLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Signing you in...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we process your magic link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Weight Challenge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a magic link
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending magic link...
                </>
              ) : (
                'Send magic link'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 