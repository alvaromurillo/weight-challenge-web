'use client';

import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Button } from './button';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg border
            ${toast.variant === 'destructive' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-white border-gray-200 text-gray-900'
            }
            animate-in slide-in-from-top-2 duration-300
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-medium">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 