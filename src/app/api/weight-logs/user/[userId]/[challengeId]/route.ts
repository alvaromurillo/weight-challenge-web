import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { 
  verifyAuthToken, 
  createAuthErrorResponse,
} from '@/lib/auth-api';
import { createSuccessResponse } from '@/lib/validation';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// GET /api/weight-logs/user/[userId]/[challengeId] - Get weight logs for user in challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; challengeId: string }> }
) {
  console.log('🔍 GET /api/weight-logs/user/[userId]/[challengeId] - Starting request');
  
  try {
    const { userId, challengeId } = await params;
    const { searchParams } = new URL(request.url);
    const latestOnly = searchParams.get('latest') === 'true';
    
    console.log('👤 User ID:', userId);
    console.log('📋 Challenge ID:', challengeId);
    console.log('🔍 Latest only:', latestOnly);

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

    // Initialize Firebase Admin SDK
    console.log('🔥 Initializing Firebase Admin SDK...');
    const db = getAdminFirestore();

    if (latestOnly) {
      // Fetch only the latest weight log
      console.log('📄 Fetching latest weight log...');
      const weightLogsQuery = db.collection('weight_logs')
        .where('userId', '==', userId)
        .where('challengeId', '==', challengeId)
        .orderBy('weighedAt', 'desc')
        .limit(1);
      
      const querySnapshot = await weightLogsQuery.get();
      
      if (querySnapshot.empty) {
        console.log('📄 No weight logs found for user in challenge');
        return NextResponse.json(
          createSuccessResponse({
            latestWeight: null,
            hasLogs: false
          })
        );
      }

      const latestLogDoc = querySnapshot.docs[0];
      const latestLogData = latestLogDoc.data();
      
      const latestWeight = latestLogData.weight;
      
      console.log('✅ Found latest weight:', latestWeight);
      console.log('✅ GET request completed successfully');

      return NextResponse.json(
        createSuccessResponse({
          latestWeight,
          hasLogs: true,
          loggedAt: latestLogData.weighedAt?.toDate?.()?.toISOString() || latestLogData.weighedAt || new Date().toISOString(),
          unit: latestLogData.unit || 'kg'
        })
      );
    } else {
      // Fetch all weight logs for user in challenge
      console.log('📄 Fetching all weight logs for user...');
      const weightLogsQuery = db.collection('weight_logs')
        .where('userId', '==', userId)
        .where('challengeId', '==', challengeId)
        .orderBy('weighedAt', 'desc');
      
      const querySnapshot = await weightLogsQuery.get();
      
      const weightLogs = querySnapshot.docs.map(doc => {
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
          count: weightLogs.length
        })
      );
    }

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