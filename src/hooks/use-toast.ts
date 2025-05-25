import { useState, useCallback, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

// Global toast state
let globalToastState: ToastState = { toasts: [] };
let listeners: Array<(state: ToastState) => void> = [];

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = (++toastCount).toString();
  const newToast: Toast = { ...toast, id };
  
  globalToastState = {
    toasts: [...globalToastState.toasts, newToast]
  };
  
  listeners.forEach(listener => listener(globalToastState));
  
  // Auto remove toast after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
  
  return id;
};

const removeToast = (id: string) => {
  globalToastState = {
    toasts: globalToastState.toasts.filter(toast => toast.id !== id)
  };
  
  listeners.forEach(listener => listener(globalToastState));
};

export const useToast = () => {
  const [state, setState] = useState<ToastState>(globalToastState);
  
  useEffect(() => {
    const listener = (newState: ToastState) => {
      setState(newState);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    return addToast(toast);
  }, []);
  
  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);
  
  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}; 