/**
 * Server-side authentication utilities for API routes
 * Handles Firebase Auth token verification and user context
 */

import { NextRequest } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  // In production, use service account key from environment variables
  // In development, use the emulator
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    // For development with emulators, initialize without credentials
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
    });
    
    // Set emulator environment variables for Firebase Admin SDK
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    }
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
    }
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  customClaims?: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify Firebase Auth token and return user information
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false,
        displayName: decodedToken.name,
        customClaims: decodedToken.custom_claims,
      }
    };

  } catch (error) {
    console.error('Auth token verification failed:', error);
    
    // Provide specific error messages for common cases
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'Authentication token has expired'
        };
      }
      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Invalid authentication token'
        };
      }
    }

    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Middleware function to require authentication for API routes
 * Returns the authenticated user or throws an error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const authResult = await verifyAuthToken(request);
  
  if (!authResult.success || !authResult.user) {
    throw new Error(authResult.error || 'Authentication required');
  }

  return authResult.user;
}

/**
 * Check if user has specific custom claims
 */
export function hasCustomClaim(user: AuthenticatedUser, claim: string, value?: any): boolean {
  if (!user.customClaims) {
    return false;
  }

  if (value !== undefined) {
    return user.customClaims[claim] === value;
  }

  return claim in user.customClaims;
}

/**
 * Check if user is an admin (has admin custom claim)
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return hasCustomClaim(user, 'admin', true);
}

/**
 * Rate limiting utilities
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiting
 * In production, consider using Redis or a proper rate limiting service
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  
  // If no record exists or window has expired, create new record
  if (!current || now > current.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }
  
  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create standardized error responses for authentication failures
 */
export function createAuthErrorResponse(message: string, status: number = 401) {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create standardized error responses for rate limiting
 */
export function createRateLimitErrorResponse(resetTime: number) {
  return {
    success: false,
    error: 'Rate limit exceeded',
    retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    timestamp: new Date().toISOString(),
  };
} 