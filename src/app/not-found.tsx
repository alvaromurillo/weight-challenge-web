import Link from 'next/link';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
} 