import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuthToken } from '@/lib/auth-api';
import { createSuccessResponse, createValidationErrorResponse } from '@/lib/validation';

// POST /api/join-requests/[id]/reject - Reject a join request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 POST /api/join-requests/[id]/reject - Starting request');
    
    const { id: requestId } = await params;
    console.log('📋 Request ID:', requestId);

    // Verify authentication
    console.log('🔐 Verifying authentication...');
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ User authenticated:', { uid: user.uid, email: user.email });

    // Get the join request
    console.log('📄 Fetching join request...');
    const joinRequestRef = adminDb.collection('join_requests').doc(requestId);
    const joinRequestSnap = await joinRequestRef.get();

    if (!joinRequestSnap.exists) {
      console.log('❌ Join request not found:', requestId);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'requestId',
          message: 'Join request not found',
          code: 'REQUEST_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    const joinRequestData = joinRequestSnap.data();
    console.log('✅ Join request found:', {
      id: requestId,
      challengeId: joinRequestData?.challengeId,
      userId: joinRequestData?.userId,
      status: joinRequestData?.status
    });

    // Verify the join request is still pending
    if (joinRequestData?.status !== 'pending') {
      console.log('❌ Join request is not pending:', joinRequestData?.status);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'status',
          message: 'Join request is no longer pending',
          code: 'REQUEST_NOT_PENDING'
        }]),
        { status: 400 }
      );
    }

    // Get the challenge and verify user is the creator
    console.log('📄 Verifying user is challenge creator...');
    const challengeRef = adminDb.collection('challenges').doc(joinRequestData.challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      console.log('❌ Challenge not found:', joinRequestData.challengeId);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'Challenge not found',
          code: 'CHALLENGE_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    if (challengeData?.creatorId !== user.uid) {
      console.log('❌ Access denied: User is not the challenge creator');
      return NextResponse.json(
        { error: 'Access denied - only challenge creators can reject join requests' },
        { status: 403 }
      );
    }

    // Update join request status to rejected
    console.log('🔥 Rejecting join request...');
    await joinRequestRef.update({
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Join request rejected successfully');
    return NextResponse.json(
      createSuccessResponse({
        message: 'Join request rejected successfully',
        requestId: requestId
      })
    );

  } catch (error) {
    console.error('❌ Error in POST /api/join-requests/[id]/reject:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 