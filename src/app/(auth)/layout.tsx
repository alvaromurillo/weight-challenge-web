import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
} 