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
import { getAdminFirestore } from '@/lib/firebase-admin';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// GET /api/weight-logs - Fetch weight logs for a user and challenge
export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/weight-logs - Starting request');
  
  try {
    // Verify authentication
    console.log('🔐 Verifying authentication...');
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ User authenticated:', {
      uid: user.uid,
      email: user.email
    });

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const userId = searchParams.get('userId') || user.uid; // Default to current user
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('📋 Request parameters:', {
      challengeId,
      userId,
      limit
    });

    // Validate required parameters
    if (!challengeId) {
      console.log('❌ Missing challengeId parameter');
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
      console.log('⚠️ User requesting data for different user:', { requestingUser: user.uid, targetUser: userId });
    }

    // Check rate limiting (100 requests per hour per user)
    const rateLimitResult = checkRateLimit(
      `get_weight_logs:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 100 } // 1 hour, 100 requests
    );

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded for user:', user.uid);
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

    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    // Fetch weight logs using Admin SDK
    console.log('📄 Fetching weight logs with Admin SDK...');
    const weightLogsRef = db.collection('weight_logs');
    const query = weightLogsRef
      .where('userId', '==', userId)
      .where('challengeId', '==', challengeId)
      .orderBy('weighedAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();
    
    const weightLogs = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit || 'kg',
        loggedAt: data.weighedAt?.toDate?.()?.toISOString() || data.weighedAt || new Date().toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      };
    });

    console.log('✅ Found weight logs:', weightLogs.length);
    console.log('✅ GET request completed successfully');

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
    console.error('❌ Error fetching weight logs:', error);
    
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
    
    console.log('Weight logs POST: Weight normalized:', {
      original: `${weightLogInput.weight} ${weightLogInput.unit}`,
      normalized: `${normalizedWeight} kg`
    });

    // Initialize Firebase Admin SDK
    console.log('Weight logs POST: Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    // Verify the user is a participant in the challenge
    console.log('Weight logs POST: Verifying challenge participation...');
    const challengeRef = db.collection('challenges').doc(weightLogInput.challengeId);
    const challengeDoc = await challengeRef.get();

    if (!challengeDoc.exists) {
      console.log('Weight logs POST: Challenge not found:', weightLogInput.challengeId);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'Challenge not found',
          code: 'CHALLENGE_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    const challengeData = challengeDoc.data();
    if (!challengeData) {
      console.log('Weight logs POST: Challenge data not found');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'Challenge data not found',
          code: 'CHALLENGE_DATA_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    // Check if user is a participant
    const participants = challengeData.participants || [];
    if (!participants.includes(user.uid)) {
      console.log('Weight logs POST: User not a participant in challenge:', {
        userId: user.uid,
        challengeId: weightLogInput.challengeId
      });
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'You are not a participant in this challenge',
          code: 'NOT_PARTICIPANT'
        }]),
        { status: 403 }
      );
    }

    // Create the weight log document
    console.log('Weight logs POST: Creating weight log document...');
    const weightLogData = {
      userId: user.uid,
      challengeId: weightLogInput.challengeId,
      weight: normalizedWeight,
      unit: 'kg', // Always store in kg
      weighedAt: new Date(weightLogInput.loggedAt),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const weightLogRef = await db.collection('weight_logs').add(weightLogData);
    const weightLogId = weightLogRef.id;

    console.log('Weight logs POST: Weight log created successfully with ID:', weightLogId);

    // Return the created weight log
    const createdWeightLog = {
      id: weightLogId,
      userId: user.uid,
      challengeId: weightLogInput.challengeId,
      weight: normalizedWeight,
      unit: 'kg',
      loggedAt: new Date(weightLogInput.loggedAt).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Weight logs POST: Returning success response');
    
    return NextResponse.json(
      createSuccessResponse({
        weightLog: createdWeightLog,
        message: 'Weight log created successfully',
      }),
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