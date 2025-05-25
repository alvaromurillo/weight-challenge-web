import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { 
  verifyAuthToken, 
  createAuthErrorResponse,
} from '@/lib/auth-api';
import { createSuccessResponse } from '@/lib/validation';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// GET /api/challenges/[id]/participants - Get participants data for a challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 GET /api/challenges/[id]/participants - Starting request');
  
  try {
    const { id: challengeId } = await params;
    console.log('📋 Challenge ID:', challengeId);

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

    // Fetch challenge document
    console.log('📄 Fetching challenge document...');
    const challengeDoc = await db.collection('challenges').doc(challengeId).get();
    
    if (!challengeDoc.exists) {
      console.log('❌ Challenge not found:', challengeId);
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const challengeData = challengeDoc.data();
    const participantIds = challengeData?.participants || [];
    
    console.log('👥 Found participant IDs:', participantIds.length);

    if (participantIds.length === 0) {
      console.log('✅ No participants found');
      return NextResponse.json(
        createSuccessResponse({
          participants: [],
          count: 0
        })
      );
    }

    // Fetch user documents for all participants
    console.log('📄 Fetching user documents...');
    const userPromises = participantIds.map((userId: string) => 
      db.collection('users').doc(userId).get()
    );
    const userDocs = await Promise.all(userPromises);
    
    const users = userDocs.map((doc, index) => {
      if (!doc.exists) {
        return {
          id: participantIds[index],
          email: 'Unknown User',
          name: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      const data = doc.data();
      return {
        id: doc.id,
        email: data?.email || 'Unknown User',
        name: data?.name || null,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Fetch weight logs for all participants in this challenge
    console.log('📄 Fetching weight logs for all participants...');
    const weightLogsQuery = db.collection('weight_logs')
      .where('challengeId', '==', challengeId);
    
    const weightLogsSnapshot = await weightLogsQuery.get();
    const allWeightLogs = weightLogsSnapshot.docs.map(doc => {
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

    // Sort weight logs by date in memory (ascending order)
    allWeightLogs.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

    // Group weight logs by user
    const weightLogsByUser = allWeightLogs.reduce((acc: any, log) => {
      if (!acc[log.userId]) {
        acc[log.userId] = [];
      }
      acc[log.userId].push(log);
      return acc;
    }, {});

    // Build participant data
    const participants = users.map(user => {
      const userLogs = weightLogsByUser[user.id] || [];
      const sortedLogs = userLogs.sort((a: any, b: any) => 
        new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
      );
      
      const startWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : null;
      const latestWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weight : null;
      const weightLoss = startWeight && latestWeight ? startWeight - latestWeight : null;
      const lastLoggedAt = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].loggedAt : null;
      
      return {
        user,
        latestWeight,
        weightLogs: userLogs,
        startWeight,
        weightLoss,
        lastLoggedAt,
      };
    });

    // Sort by weight loss (descending) - those with more weight loss first
    participants.sort((a, b) => {
      if (a.weightLoss === null && b.weightLoss === null) return 0;
      if (a.weightLoss === null) return 1;
      if (b.weightLoss === null) return -1;
      return b.weightLoss - a.weightLoss;
    });

    console.log('✅ Found participants:', participants.length);
    console.log('✅ GET request completed successfully');

    return NextResponse.json(
      createSuccessResponse({
        participants,
        count: participants.length
      })
    );

  } catch (error) {
    console.error('❌ Error fetching challenge participants:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch challenge participants',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 