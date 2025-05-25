import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuthToken } from '@/lib/auth-api';
import { createValidationErrorResponse, createSuccessResponse } from '@/lib/validation';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// POST /api/challenges/join - Join a challenge using invitation code
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/challenges/join - Starting request');

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

    // Parse request body
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

    // Validate required fields
    if (!body.challengeId || typeof body.challengeId !== 'string') {
      console.log('❌ Invalid challengeId:', body.challengeId);
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'challengeId is required and must be a string',
          code: 'INVALID_CHALLENGE_ID'
        }]),
        { status: 400 }
      );
    }

    const { challengeId } = body;

    // Get challenge document using Admin SDK
    console.log('📄 Fetching challenge document...');
    const challengeRef = adminDb.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      console.log('❌ Challenge not found:', challengeId);
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
    console.log('✅ Challenge found:', {
      id: challengeId,
      name: challengeData?.name,
      participants: challengeData?.participants?.length || 0
    });

    // Check if challenge is still active
    if (!challengeData?.isActive) {
      console.log('❌ Challenge is not active');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'This challenge is no longer active',
          code: 'CHALLENGE_INACTIVE'
        }]),
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const participants = challengeData.participants || [];
    if (participants.includes(user.uid)) {
      console.log('❌ User already a participant');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'userId',
          message: 'You are already a participant in this challenge',
          code: 'ALREADY_PARTICIPANT'
        }]),
        { status: 400 }
      );
    }

    // Check if challenge has ended
    const endDate = challengeData.endDate?.toDate?.() || new Date(challengeData.endDate);
    if (new Date() > endDate) {
      console.log('❌ Challenge has ended');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'This challenge has already ended',
          code: 'CHALLENGE_ENDED'
        }]),
        { status: 400 }
      );
    }

    // Check participant limit
    const participantLimit = challengeData.participantLimit || 10;
    if (participants.length >= participantLimit) {
      console.log('❌ Challenge is full');
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challengeId',
          message: 'This challenge is full',
          code: 'CHALLENGE_FULL'
        }]),
        { status: 400 }
      );
    }

    // Add user to participants array using Admin SDK
    console.log('🔥 Adding user to challenge participants...');
    await challengeRef.update({
      participants: FieldValue.arrayUnion(user.uid),
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ User successfully joined challenge');

    // Get updated challenge data
    const updatedChallengeSnap = await challengeRef.get();
    const updatedChallengeData = updatedChallengeSnap.data();

    const challenge = {
      id: challengeId,
      name: updatedChallengeData?.name,
      description: updatedChallengeData?.description,
      creatorId: updatedChallengeData?.creatorId,
      invitationCode: updatedChallengeData?.invitationCode,
      startDate: updatedChallengeData?.startDate?.toDate?.()?.toISOString() || null,
      endDate: updatedChallengeData?.endDate?.toDate?.()?.toISOString() || null,
      joinByDate: updatedChallengeData?.joinByDate?.toDate?.()?.toISOString() || null,
      isActive: updatedChallengeData?.isActive,
      isArchived: updatedChallengeData?.isArchived || false,
      participants: updatedChallengeData?.participants || [],
      memberCount: updatedChallengeData?.memberCount || 0,
      participantLimit: updatedChallengeData?.participantLimit || 10,
      createdAt: updatedChallengeData?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedChallengeData?.updatedAt?.toDate?.()?.toISOString() || null,
    };

    console.log('✅ POST request completed successfully');
    return NextResponse.json(createSuccessResponse({
      challenge,
      message: 'Successfully joined challenge'
    }));

  } catch (error) {
    console.error('❌ Error in POST /api/challenges/join:', error);
    const err = error as Error;
    return NextResponse.json(
      createValidationErrorResponse([{
        field: 'general',
        message: err.message || 'Failed to join challenge',
        code: 'JOIN_ERROR'
      }]),
      { status: 500 }
    );
  }
} 