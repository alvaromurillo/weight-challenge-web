import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/weight-logs/[id] - Update a weight log
export async function PUT(request: NextRequest, { params }: RouteParams) {
  console.log('🔄 PUT /api/weight-logs/[id] - Starting request');
  
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

    // Check rate limiting (30 updates per hour per user)
    const rateLimitResult = checkRateLimit(
      `update_weight_log:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 30 } // 1 hour, 30 requests
    );

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded for user:', user.uid);
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    const { id } = await params;
    
    if (!id) {
      console.log('❌ Missing weight log ID');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Weight log ID is required',
          code: 'MISSING_WEIGHT_LOG_ID'
        }]),
        { status: 400 }
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

    console.log('📋 Request body:', body);

    // Validate the input
    const validationResult = validateCreateWeightLog(body as CreateWeightLogInput);
    if (!validationResult.isValid) {
      console.log('❌ Validation failed:', validationResult.errors);
      return NextResponse.json(
        createValidationErrorResponse(validationResult.errors),
        { status: 400 }
      );
    }

    const validatedData = body as CreateWeightLogInput;
    console.log('✅ Data validated:', validatedData);

    // Get the weight log to verify ownership
    console.log('📄 Fetching weight log to verify ownership...');
    const weightLogRef = db.collection('weight_logs').doc(id);
    const weightLogDoc = await weightLogRef.get();

    if (!weightLogDoc.exists) {
      console.log('❌ Weight log not found:', id);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Weight log not found',
          code: 'WEIGHT_LOG_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    const weightLogData = weightLogDoc.data();
    if (!weightLogData) {
      console.log('❌ Weight log data not found:', id);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Weight log data not found',
          code: 'WEIGHT_LOG_DATA_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }
    
    // Verify that the user owns this weight log
    if (weightLogData.userId !== user.uid) {
      console.log('❌ Unauthorized access attempt:', {
        weightLogUserId: weightLogData.userId,
        requestingUserId: user.uid
      });
      return NextResponse.json(
        createAuthErrorResponse('Unauthorized to update this weight log'),
        { status: 403 }
      );
    }

    // Normalize weight to kg for storage
    const normalizedWeight = normalizeWeight(validatedData.weight, validatedData.unit);
    console.log('⚖️ Weight normalized:', {
      original: `${validatedData.weight} ${validatedData.unit}`,
      normalized: `${normalizedWeight} kg`
    });

    // Prepare update data
    const updateData = {
      weight: normalizedWeight,
      unit: 'kg', // Always store in kg
      weighedAt: new Date(validatedData.loggedAt),
      updatedAt: new Date(),
    };

    console.log('📝 Updating weight log with data:', updateData);

    // Update the weight log
    await weightLogRef.update(updateData);

    console.log('✅ Weight log updated successfully');

    // Return the updated weight log data
    const updatedWeightLog = {
      id,
      userId: user.uid,
      challengeId: weightLogData.challengeId,
      weight: normalizedWeight,
      unit: 'kg',
      loggedAt: validatedData.loggedAt,
      createdAt: weightLogData.createdAt?.toDate?.()?.toISOString() || weightLogData.createdAt,
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ PUT request completed successfully');

    return NextResponse.json(
      createSuccessResponse({
        weightLog: updatedWeightLog,
        message: 'Weight log updated successfully',
      }),
      { 
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('❌ Error updating weight log:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update weight log',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/weight-logs/[id] - Delete a weight log
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Firebase Admin SDK
    const db = getAdminFirestore();

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Weight log ID is required' },
        { status: 400 }
      );
    }

    // Get the weight log to verify ownership
    const weightLogRef = db.collection('weight_logs').doc(id);
    const weightLogDoc = await weightLogRef.get();

    if (!weightLogDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Weight log not found' },
        { status: 404 }
      );
    }

    const weightLogData = weightLogDoc.data();
    if (!weightLogData) {
      return NextResponse.json(
        { success: false, error: 'Weight log data not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user owns this weight log
    if (weightLogData.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this weight log' },
        { status: 403 }
      );
    }

    // Delete the weight log
    await weightLogRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Weight log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting weight log:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 