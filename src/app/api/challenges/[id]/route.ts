import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  validateUpdateChallenge, 
  createValidationErrorResponse, 
  createSuccessResponse,
  sanitizeString,
  isValidString,
  type UpdateChallengeInput
} from '@/lib/validation';
import { 
  verifyAuthToken, 
  checkRateLimit, 
  createAuthErrorResponse, 
  createRateLimitErrorResponse,
} from '@/lib/auth-api';

// GET /api/challenges/[id] - Fetch a specific challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;

    // Validate challenge ID
    if (!challengeId || !isValidString(challengeId, 255)) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Challenge ID is required and must be a valid string',
          code: 'INVALID_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    // Get challenge document from Firestore
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    if (!challengeData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge data not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const challenge = {
      id: challengeSnap.id,
      ...challengeData,
      // Convert Firestore timestamps to ISO strings for JSON serialization
      createdAt: challengeData.createdAt?.toDate?.()?.toISOString() || null,
      startDate: challengeData.startDate?.toDate?.()?.toISOString() || null,
      endDate: challengeData.endDate?.toDate?.()?.toISOString() || null,
      joinByDate: challengeData.joinByDate?.toDate?.()?.toISOString() || null,
    };

    return NextResponse.json(createSuccessResponse(challenge));

  } catch (error) {
    console.error('Error fetching challenge:', error);
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PUT /api/challenges/[id] - Update a challenge (only creator can update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;

    // Validate challenge ID
    if (!challengeId || !isValidString(challengeId, 255)) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Challenge ID is required and must be a valid string',
          code: 'INVALID_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Check rate limiting (10 updates per hour per user)
    const rateLimitResult = checkRateLimit(
      `update_challenge:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 10 } // 1 hour, 10 requests
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Get challenge document from Firestore
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    if (!challengeData || challengeData.creatorId !== user.uid) {
      return NextResponse.json(
        createAuthErrorResponse('Only the challenge creator can update this challenge'),
        { status: 403 }
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

    // Sanitize and prepare update data
    const updateInput: UpdateChallengeInput = {};
    
    if (body.name !== undefined) {
      updateInput.name = sanitizeString(body.name);
    }
    
    if (body.description !== undefined) {
      updateInput.description = sanitizeString(body.description);
    }
    
    if (body.participantLimit !== undefined) {
      updateInput.participantLimit = body.participantLimit;
    }

    // Validate update input
    const validationResult = validateUpdateChallenge(updateInput);
    if (!validationResult.isValid) {
      return NextResponse.json(
        createValidationErrorResponse(validationResult.errors),
        { status: 400 }
      );
    }

    // Check if challenge has already started (prevent certain updates)
    const now = new Date();
    const joinByDate = challengeData.joinByDate?.toDate();
    
    if (joinByDate && now > joinByDate) {
      // Challenge has started, only allow limited updates
      const allowedFields = ['description'];
      const attemptedFields = Object.keys(updateInput);
      const restrictedFields = attemptedFields.filter(field => !allowedFields.includes(field));
      
      if (restrictedFields.length > 0) {
        return NextResponse.json(
          createValidationErrorResponse([{
            field: 'update',
            message: `Cannot update ${restrictedFields.join(', ')} after challenge has started. Only description can be updated.`,
            code: 'CHALLENGE_STARTED'
          }]),
          { status: 400 }
        );
      }
    }

    // Prepare Firestore update data
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updateInput.name !== undefined) {
      updateData.name = updateInput.name;
    }
    
    if (updateInput.description !== undefined) {
      updateData.description = updateInput.description;
    }
    
    if (updateInput.participantLimit !== undefined) {
      updateData.participantLimit = updateInput.participantLimit;
    }

    // Update the challenge
    await challengeRef.update(updateData);

    // Fetch updated challenge data
    const updatedSnap = await challengeRef.get();
    const updatedData = updatedSnap.data();
    
    const updatedChallenge = {
      id: challengeId,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || null,
      startDate: updatedData?.startDate?.toDate?.()?.toISOString() || null,
      endDate: updatedData?.endDate?.toDate?.()?.toISOString() || null,
      joinByDate: updatedData?.joinByDate?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    return NextResponse.json(
      createSuccessResponse(updatedChallenge, 'Challenge updated successfully'),
      { 
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error updating challenge:', error);
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
        error: 'Failed to update challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/challenges/[id] - Delete a challenge (only creator can delete, and only if not started)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;

    // Validate challenge ID
    if (!challengeId || !isValidString(challengeId, 255)) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Challenge ID is required and must be a valid string',
          code: 'INVALID_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Check rate limiting (5 deletions per hour per user)
    const rateLimitResult = checkRateLimit(
      `delete_challenge:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 5 } // 1 hour, 5 requests
    );

    if (!rateLimitResult.allowed) {
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

    // Get challenge document from Firestore
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    if (!challengeData || challengeData.creatorId !== user.uid) {
      return NextResponse.json(
        createAuthErrorResponse('Only the challenge creator can delete this challenge'),
        { status: 403 }
      );
    }

    // Check if challenge has started (prevent deletion)
    const now = new Date();
    const joinByDate = challengeData.joinByDate?.toDate();
    
    if (joinByDate && now > joinByDate) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'delete',
          message: 'Cannot delete challenge after it has started',
          code: 'CHALLENGE_STARTED'
        }]),
        { status: 400 }
      );
    }

    // Check if challenge has participants other than creator
    const memberCount = challengeData.memberCount || 0;
    if (memberCount > 1) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'delete',
          message: 'Cannot delete challenge with participants. Please remove all participants first.',
          code: 'HAS_PARTICIPANTS'
        }]),
        { status: 400 }
      );
    }

    // Delete the challenge
    await challengeRef.delete();

    // TODO: Also delete related documents (memberships, weight logs, etc.)
    // This would typically be done via a Cloud Function to ensure consistency

    return NextResponse.json(
      createSuccessResponse(
        { challengeId, deletedAt: new Date().toISOString() },
        'Challenge deleted successfully'
      ),
      { 
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error deleting challenge:', error);
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
        error: 'Failed to delete challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/challenges/[id] - Archive or unarchive a challenge (only creator can archive/unarchive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;
    
    console.log('🔍 PATCH /api/challenges/[id] - Starting request');
    console.log('  Challenge ID:', challengeId);

    // Validate challenge ID
    if (!challengeId || !isValidString(challengeId, 255)) {
      console.log('❌ Invalid challenge ID');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'id',
          message: 'Challenge ID is required and must be a valid string',
          code: 'INVALID_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    // Verify authentication
    console.log('🔐 Verifying authentication...');
    const authResult = await verifyAuthToken(request);
    console.log('  Auth result:', { success: authResult.success, hasUser: !!authResult.user });
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ User authenticated:', { uid: user.uid, email: user.email });

    // Check rate limiting (20 archive/unarchive actions per hour per user)
    const rateLimitResult = checkRateLimit(
      `patch_challenge:${user.uid}`,
      { windowMs: 60 * 60 * 1000, maxRequests: 20 } // 1 hour, 20 requests
    );

    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded for user:', user.uid);
      return NextResponse.json(
        createRateLimitErrorResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Get challenge document from Firestore using Admin SDK
    console.log('📄 Fetching challenge document...');
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      console.log('❌ Challenge not found:', challengeId);
      return NextResponse.json(
        {
          success: false,
          error: 'Challenge not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    console.log('✅ Challenge found:', {
      id: challengeId,
      name: challengeData?.name,
      creatorId: challengeData?.creatorId,
      currentUserId: user.uid,
      isCreator: challengeData?.creatorId === user.uid
    });

    if (!challengeData || challengeData.creatorId !== user.uid) {
      console.log('❌ Permission denied - user is not creator:', {
        challengeCreator: challengeData?.creatorId,
        currentUser: user.uid
      });
      return NextResponse.json(
        createAuthErrorResponse('Only the challenge creator can archive/unarchive this challenge'),
        { status: 403 }
      );
    }

    // Parse and validate request body
    console.log('📝 Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('  Request body:', body);
    } catch (error) {
      console.log('❌ Invalid JSON in request body:', error);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'body',
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }]),
        { status: 400 }
      );
    }

    // Validate archive action
    if (typeof body.isArchived !== 'boolean') {
      console.log('❌ Invalid isArchived value:', body.isArchived);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'isArchived',
          message: 'isArchived must be a boolean value',
          code: 'INVALID_ARCHIVE_STATUS'
        }]),
        { status: 400 }
      );
    }

    // Update challenge archive status using Admin SDK
    console.log('🔥 Attempting Firestore update with Admin SDK...');
    console.log('  Update data:', { isArchived: body.isArchived });
    console.log('  User context:', { uid: user.uid, email: user.email });
    
    try {
      await challengeRef.update({
        isArchived: body.isArchived,
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log('✅ Firestore update successful');
    } catch (firestoreError) {
      console.error('❌ Firestore update failed:', firestoreError);
      const err = firestoreError as Error;
      console.error('  Error code:', (err as any).code);
      console.error('  Error message:', err.message);
      throw firestoreError; // Re-throw to be caught by outer catch
    }

    // Get updated challenge data
    console.log('📄 Fetching updated challenge data...');
    const updatedChallengeSnap = await challengeRef.get();
    const updatedChallengeData = updatedChallengeSnap.data();
    
    const updatedChallenge = {
      id: updatedChallengeSnap.id,
      ...updatedChallengeData,
      // Convert Firestore timestamps to ISO strings for JSON serialization
      createdAt: updatedChallengeData?.createdAt?.toDate?.()?.toISOString() || null,
      startDate: updatedChallengeData?.startDate?.toDate?.()?.toISOString() || null,
      endDate: updatedChallengeData?.endDate?.toDate?.()?.toISOString() || null,
      joinByDate: updatedChallengeData?.joinByDate?.toDate?.()?.toISOString() || null,
      updatedAt: updatedChallengeData?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    console.log('✅ PATCH request completed successfully');
    return NextResponse.json(
      createSuccessResponse(
        updatedChallenge,
        body.isArchived ? 'Challenge archived successfully' : 'Challenge unarchived successfully'
      )
    );

  } catch (error) {
    console.error('❌ Error archiving/unarchiving challenge:', error);
    const err = error as Error;
    
    // Log detailed error information
    console.error('  Error details:', {
      name: err.name,
      message: err.message,
      code: (err as any).code,
      stack: err.stack
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive/unarchive challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 