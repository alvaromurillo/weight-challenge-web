import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-api';
import { createValidationErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('🔍 GET /api/challenges/user/[userId] - Starting request');
    
    const { userId } = await params;
    console.log('  User ID:', userId);

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

    // Verify user can only access their own challenges (or is admin)
    if (user.uid !== userId) {
      console.log('❌ Access denied: User trying to access another user\'s challenges');
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get challenges where user is a participant using Admin SDK
    console.log('📄 Fetching user challenges with Admin SDK...');
    const challengesRef = adminDb.collection('challenges');
    const query = challengesRef
      .where('participants', 'array-contains', userId)
      .orderBy('createdAt', 'desc');
    
    const querySnapshot = await query.get();
    console.log('✅ Found challenges:', querySnapshot.size);

    const challenges = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        creatorId: data.creatorId,
        invitationCode: data.invitationCode,
        startDate: data.startDate?.toDate?.()?.toISOString() || null,
        endDate: data.endDate?.toDate?.()?.toISOString() || null,
        joinByDate: data.joinByDate?.toDate?.()?.toISOString() || null,
        isActive: data.isActive,
        isArchived: data.isArchived || false,
        participants: data.participants || [],
        memberCount: data.memberCount || 0,
        participantLimit: data.participantLimit || 10,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    console.log('✅ GET request completed successfully');
    return NextResponse.json(createSuccessResponse({
      challenges,
      count: challenges.length
    }));

  } catch (error) {
    console.error('❌ Error in GET /api/challenges/user/[userId]:', error);
    const err = error as Error;
    return NextResponse.json(
      createValidationErrorResponse([{
        field: 'general',
        message: err.message || 'Failed to fetch user challenges',
        code: 'FETCH_ERROR'
      }]),
      { status: 500 }
    );
  }
} 