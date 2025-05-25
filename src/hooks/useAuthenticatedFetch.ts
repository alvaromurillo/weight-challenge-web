import { useAuth } from './useAuth';
import { useCallback, useMemo } from 'react';

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export function useAuthenticatedFetch() {
  const { user } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: AuthenticatedFetchOptions = {}
  ): Promise<Response> => {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    // Add authentication token if user is logged in and not skipping auth
    if (!skipAuth && user) {
      try {
        const token = await user.getIdToken();
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get auth token:', error);
        throw new Error('Authentication failed');
      }
    }

    // Make the request
    return fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });
  }, [user]);

  return authenticatedFetch;
}

// Convenience hook for common API operations
export function useAuthenticatedApi() {
  const authenticatedFetch = useAuthenticatedFetch();

  // Memoize the API object to prevent unnecessary re-renders
  const api = useMemo(() => {
    const get = async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    };

    const post = async <T = unknown>(url: string, data: unknown): Promise<T> => {
      const response = await authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`POST ${url} failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    const put = async <T = unknown>(url: string, data: unknown): Promise<T> => {
      const response = await authenticatedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`PUT ${url} failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    const del = async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`DELETE ${url} failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    };

    return {
      get,
      post,
      put,
      delete: del,
      fetch: authenticatedFetch,
    };
  }, [authenticatedFetch]);

  return api;
} 