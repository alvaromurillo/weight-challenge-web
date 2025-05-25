import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-api';
import { createSuccessResponse, createValidationErrorResponse } from '@/lib/validation';

// GET /api/challenges/[id]/join-requests - Get join requests for a challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 GET /api/challenges/[id]/join-requests - Starting request');
    
    const { id: challengeId } = await params;
    console.log('📋 Challenge ID:', challengeId);

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

    // Verify user is the challenge creator
    console.log('📄 Verifying user is challenge creator...');
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      console.log('❌ Challenge not found:', challengeId);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const challengeData = challengeSnap.data();
    if (challengeData?.creatorId !== user.uid) {
      console.log('❌ Access denied: User is not the challenge creator');
      return NextResponse.json(
        { error: 'Access denied - only challenge creators can view join requests' },
        { status: 403 }
      );
    }

    // Get join requests for the challenge using Admin SDK
    console.log('📄 Fetching join requests with Admin SDK...');
    const joinRequestsRef = adminDb.collection('join_requests');
    const query = joinRequestsRef
      .where('challengeId', '==', challengeId)
      .where('status', '==', 'pending')
      .orderBy('requestedAt', 'desc');
    
    const querySnapshot = await query.get();
    console.log('✅ Found join requests:', querySnapshot.size);

    // Fetch user data for each join request
    const joinRequests = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Fetch user information
      const userDoc = await adminDb.collection('users').doc(data.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      
      const joinRequest = {
        id: doc.id,
        challengeId: data.challengeId,
        userId: data.userId,
        targetWeight: data.targetWeight,
        startWeight: data.startWeight,
        goalType: data.goalType,
        status: data.status,
        requestedAt: data.requestedAt?.toDate?.()?.toISOString() || data.requestedAt,
        createdAt: data.requestedAt?.toDate?.()?.toISOString() || data.requestedAt,
        updatedAt: data.requestedAt?.toDate?.()?.toISOString() || data.requestedAt,
        // User information
        userDisplayName: userData?.displayName || userData?.email || 'Unknown User',
        userEmail: userData?.email,
        userPhotoURL: userData?.photoURL,
      };
      
      joinRequests.push(joinRequest);
    }

    console.log('✅ GET request completed successfully');
    return NextResponse.json(
      createSuccessResponse({
        joinRequests,
        count: joinRequests.length
      })
    );

  } catch (error) {
    console.error('❌ Error in GET /api/challenges/[id]/join-requests:', error);
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