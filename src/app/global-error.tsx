'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-6xl font-bold text-red-600 mb-4">⚠️</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 