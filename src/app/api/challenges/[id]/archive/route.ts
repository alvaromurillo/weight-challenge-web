import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  createValidationErrorResponse, 
  createSuccessResponse,
  isValidString,
} from '@/lib/validation';
import { 
  verifyAuthToken, 
  checkRateLimit, 
  createAuthErrorResponse, 
  createRateLimitErrorResponse,
} from '@/lib/auth-api';

// PATCH /api/challenges/[id]/archive - Archive or unarchive a challenge (only creator can archive/unarchive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await params;
    
    console.log('🔍 PATCH /api/challenges/[id]/archive - Starting request');
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
    console.log('📄 Fetching challenge document with Admin SDK...');
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
      console.log('✅ Firestore update successful with Admin SDK');
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

    console.log('✅ PATCH request completed successfully with Admin SDK');
    return NextResponse.json(
      createSuccessResponse(
        updatedChallenge,
        body.isArchived ? 'Challenge archived successfully' : 'Challenge unarchived successfully'
      )
    );

  } catch (error) {
    console.error('❌ Error archiving/unarchiving challenge with Admin SDK:', error);
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