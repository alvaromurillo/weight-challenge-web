import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { 
  validateCreateChallenge, 
  createValidationErrorResponse, 
  createSuccessResponse,
  sanitizeString,
  VALIDATION_CONSTANTS,
  type CreateChallengeInput
} from '@/lib/validation';
import { 
  verifyAuthToken, 
  checkRateLimit, 
  createAuthErrorResponse, 
  createRateLimitErrorResponse,
} from '@/lib/auth-api';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// GET /api/challenges - Fetch challenges with optional filtering and pagination
export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/challenges - Starting request');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const limitParam = searchParams.get('limit');
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status'); // 'active', 'upcoming', 'ended'
    
    console.log('📋 Request parameters:', {
      limit: limitParam,
      creatorId,
      status
    });
    
    // Validate limit parameter
    let maxResults = 10; // default
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        console.log('❌ Invalid limit parameter:', limitParam);
        return NextResponse.json(
          createValidationErrorResponse([{
            field: 'limit',
            message: 'Limit must be a number between 1 and 100',
            code: 'INVALID_LIMIT'
          }]),
          { status: 400 }
        );
      }
      maxResults = parsedLimit;
    }

    // Validate status parameter
    if (status && !['active', 'upcoming', 'ended'].includes(status)) {
      console.log('❌ Invalid status parameter:', status);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'status',
          message: 'Status must be one of: active, upcoming, ended',
          code: 'INVALID_STATUS'
        }]),
        { status: 400 }
      );
    }

    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    // Build Firestore query using Admin SDK
    console.log('📄 Fetching challenges with Admin SDK...');
    const challengesRef = db.collection('challenges');
    let query = challengesRef.orderBy('createdAt', 'desc').limit(maxResults);

    // Add filters if provided
    if (creatorId) {
      query = challengesRef.where('creatorId', '==', creatorId).orderBy('createdAt', 'desc').limit(maxResults);
    }

    // Note: Status filtering would require additional logic to compare dates
    // For now, we'll fetch all and filter in memory for simplicity
    const querySnapshot = await query.get();
    let challenges = querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        startDate: data.startDate?.toDate?.()?.toISOString() || null,
        endDate: data.endDate?.toDate?.()?.toISOString() || null,
        joinByDate: data.joinByDate?.toDate?.()?.toISOString() || null,
      };
    });

    // Apply status filtering if requested
    if (status) {
      const now = new Date();
      challenges = challenges.filter(challenge => {
        const endDate = new Date(challenge.endDate);
        const joinByDate = new Date(challenge.joinByDate);
        
        switch (status) {
          case 'active':
            return now >= joinByDate && now <= endDate;
          case 'upcoming':
            return now < joinByDate;
          case 'ended':
            return now > endDate;
          default:
            return true;
        }
      });
    }

    console.log('✅ Found challenges:', challenges.length);
    console.log('✅ GET request completed successfully');

    return NextResponse.json(createSuccessResponse({
      challenges,
      count: challenges.length,
      filters: {
        limit: maxResults,
        creatorId: creatorId || null,
        status: status || null,
      }
    }));

  } catch (error) {
    console.error('❌ Error fetching challenges:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch challenges',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST /api/challenges - Create a new challenge with comprehensive validation
export async function POST(request: NextRequest) {
  console.log('🔍 POST /api/challenges - Starting request');
  
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

    // Check rate limiting (5 challenges per hour per user)
    const rateLimitResult = checkRateLimit(
      `create_challenge:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 5 } // 1 hour, 5 requests
    );

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded for user:', user.uid);
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
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
      console.log('❌ Invalid JSON in request body');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'body',
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }]),
        { status: 400 }
      );
    }

    console.log('📝 Parsing request body...');

    // Sanitize string inputs
    const sanitizedInput: CreateChallengeInput = {
      name: sanitizeString(body.name || ''),
      description: sanitizeString(body.description || ''),
      endDate: body.endDate,
      joinByDate: body.joinByDate,
      targetWeight: body.targetWeight,
      startWeight: body.startWeight,
      goalType: body.goalType,
      participantLimit: body.participantLimit || VALIDATION_CONSTANTS.PARTICIPANT_LIMIT.DEFAULT,
    };

    // Validate input
    const validationResult = validateCreateChallenge(sanitizedInput);
    if (!validationResult.isValid) {
      console.log('❌ Validation failed:', validationResult.errors);
      return NextResponse.json(
        createValidationErrorResponse(validationResult.errors),
        { status: 400 }
      );
    }

    // Generate invitation code (simple implementation for now)
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    // Create challenge document
    const challengeData = {
      name: sanitizedInput.name,
      description: sanitizedInput.description,
      endDate: new Date(sanitizedInput.endDate),
      joinByDate: new Date(sanitizedInput.joinByDate),
      creatorId: user.uid,
      createdAt: new Date(),
      memberCount: 1, // Creator is automatically a member
      participantLimit: sanitizedInput.participantLimit,
      invitationCode,
      isActive: true,
      participants: [user.uid], // Add creator to participants array
    };

    console.log('🔥 Creating challenge document with Admin SDK...');
    // Add to Firestore using Admin SDK
    const docRef = await db.collection('challenges').add(challengeData);

    console.log('✅ Challenge created successfully with ID:', docRef.id);

    // TODO: Create initial challenge membership for creator
    // This would typically be done via a Cloud Function to ensure consistency

    return NextResponse.json(
      createSuccessResponse({
        challengeId: docRef.id,
        invitationCode,
        challenge: {
          id: docRef.id,
          ...challengeData,
          endDate: challengeData.endDate.toISOString(),
          joinByDate: challengeData.joinByDate.toISOString(),
          createdAt: challengeData.createdAt.toISOString(),
        }
      }, 'Challenge created successfully'),
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    
    // Handle specific error types
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
        error: 'Failed to create challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 