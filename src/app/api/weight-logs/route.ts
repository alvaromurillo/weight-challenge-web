import { NextRequest, NextResponse } from 'next/server';
import { 
  validateCreateWeightLog, 
  createValidationErrorResponse, 
  createSuccessResponse,
  normalizeWeight,
  type CreateWeightLogInput
} from '@/lib/validation';
import { 
  verifyAuthToken, 
  checkRateLimit, 
  createAuthErrorResponse, 
  createRateLimitErrorResponse,
} from '@/lib/auth-api';
import { getUserWeightLogs, addWeightLog } from '@/lib/challenges';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// GET /api/weight-logs - Fetch weight logs for a user and challenge
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const userId = searchParams.get('userId') || user.uid; // Default to current user

    // Validate required parameters
    if (!challengeId) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'Challenge ID is required',
          code: 'MISSING_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    // Check if user is requesting their own data or has permission to view others
    if (userId !== user.uid) {
      // In a real implementation, you would check if the user has permission
      // to view other users' weight logs (e.g., if they're in the same challenge)
      // For now, we'll allow it but this should be restricted based on business rules
    }

    // Check rate limiting (100 requests per hour per user)
    const rateLimitResult = checkRateLimit(
      `get_weight_logs:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 100 } // 1 hour, 100 requests
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Fetch weight logs
    const weightLogs = await getUserWeightLogs(userId, challengeId);

    return NextResponse.json(
      createSuccessResponse({
        weightLogs,
        count: weightLogs.length,
        userId,
        challengeId,
      }),
      { 
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error fetching weight logs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weight logs',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/weight-logs - Create a new weight log
export async function POST(request: NextRequest) {
  try {
    console.log('Weight logs POST: Starting request processing');
    
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('Weight logs POST: User authenticated:', user.uid);

    // Check rate limiting (50 weight logs per hour per user)
    const rateLimitResult = checkRateLimit(
      `create_weight_log:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 50 } // 1 hour, 50 requests
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'body',
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }]),
        { status: 400 }
      );
    }

    console.log('Weight logs POST: Request body parsed:', { ...body, weight: body.weight ? 'present' : 'missing' });
    
    // Prepare input for validation
    const weightLogInput: CreateWeightLogInput = {
      challengeId: body.challengeId,
      weight: body.weight,
      unit: body.unit || 'kg',
      loggedAt: body.loggedAt || new Date().toISOString(),
    };

    // Validate input
    const validationResult = validateCreateWeightLog(weightLogInput);
    if (!validationResult.isValid) {
      console.log('Weight logs POST: Validation failed:', validationResult.errors);
      return NextResponse.json(
        createValidationErrorResponse(validationResult.errors),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Normalize weight to kg for storage
    const normalizedWeight = normalizeWeight(weightLogInput.weight, weightLogInput.unit);
    
    // TODO: Implement actual weight log creation
    // This would typically involve:
    // 1. Verifying the user is a participant in the challenge
    // 2. Checking if the challenge is active and within the logging period
    // 3. Creating the weight log document in Firestore
    // 4. Updating any related statistics or calculations
    
    // For now, return mock success response
    const mockWeightLog = {
      id: `mock_${Date.now()}`,
      userId: user.uid,
      challengeId: weightLogInput.challengeId,
      weight: normalizedWeight,
      unit: 'kg', // Always store in kg
      loggedAt: new Date(weightLogInput.loggedAt).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Weight logs POST: Returning mock success response');
    
    return NextResponse.json(
      createSuccessResponse(mockWeightLog, 'Weight log created successfully'),
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error creating weight log:', error);
    const err = error as Error;
    if (err.message.includes('Authentication')) {
      return NextResponse.json(
        createAuthErrorResponse(err.message),
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create weight log',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 