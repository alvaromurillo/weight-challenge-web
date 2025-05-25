import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-api';
import { createSuccessResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    console.log('🔍 GET /api/weight-logs/challenge/[challengeId] - Starting request');
    
    const { challengeId } = await params;
    console.log('  Challenge ID:', challengeId);

    // Verify authentication
    console.log('🔐 Verifying authentication...');
    const authResult = await verifyAuthToken(request);
    console.log('  Auth result:', { success: authResult.success, hasUser: !!authResult.user });
    
    if (!authResult.success || !authResult.user) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    console.log('✅ User authenticated:', { uid: user.uid, email: user.email });

    // Verify user is a participant in the challenge
    console.log('📄 Verifying user is participant in challenge...');
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
    const isParticipant = challengeData?.participants?.includes(user.uid) || 
                         challengeData?.creatorId === user.uid;

    if (!isParticipant) {
      console.log('❌ Access denied: User is not a participant in this challenge');
      return NextResponse.json(
        { error: 'Access denied - you must be a participant in this challenge' },
        { status: 403 }
      );
    }

    // Get all weight logs for the challenge using Admin SDK
    console.log('📄 Fetching challenge weight logs with Admin SDK...');
    const weightLogsRef = adminDb.collection('weight_logs');
    const query = weightLogsRef
      .where('challengeId', '==', challengeId)
      .orderBy('weighedAt', 'desc');
    
    const querySnapshot = await query.get();
    console.log('✅ Found weight logs:', querySnapshot.size);

    const weightLogs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit,
        loggedAt: data.weighedAt?.toDate?.()?.toISOString() || data.weighedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    console.log('✅ GET request completed successfully');
    return NextResponse.json(
      createSuccessResponse({
        weightLogs,
        count: weightLogs.length
      })
    );

  } catch (error) {
    console.error('❌ Error in GET /api/weight-logs/challenge/[challengeId]:', error);
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