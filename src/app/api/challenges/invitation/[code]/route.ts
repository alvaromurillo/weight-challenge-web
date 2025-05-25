import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-api';
import { createValidationErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    console.log('🔍 GET /api/challenges/invitation/[code] - Starting request');
    
    const { code } = await params;
    console.log('  Invitation code:', code);

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

    // Find challenge by invitation code using Admin SDK
    console.log('📄 Searching for challenge with invitation code...');
    const challengesRef = adminDb.collection('challenges');
    const query = challengesRef
      .where('invitationCode', '==', code.toUpperCase())
      .where('isActive', '==', true);
    
    const querySnapshot = await query.get();
    console.log('✅ Query completed, found challenges:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('❌ No challenge found with invitation code:', code);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'invitationCode',
          message: 'Invalid invitation code',
          code: 'CHALLENGE_NOT_FOUND'
        }]),
        { status: 404 }
      );
    }

    // Get the first matching challenge
    const challengeDoc = querySnapshot.docs[0];
    const data = challengeDoc.data();
    
    const challenge = {
      id: challengeDoc.id,
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

    console.log('✅ GET request completed successfully');
    return NextResponse.json(createSuccessResponse({
      challenge
    }));

  } catch (error) {
    console.error('❌ Error in GET /api/challenges/invitation/[code]:', error);
    const err = error as Error;
    return NextResponse.json(
      createValidationErrorResponse([{
        field: 'general',
        message: err.message || 'Failed to find challenge',
        code: 'SEARCH_ERROR'
      }]),
      { status: 500 }
    );
  }
} 