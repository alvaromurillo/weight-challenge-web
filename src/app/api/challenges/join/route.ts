import { NextRequest, NextResponse } from 'next/server';
import { 
  validateJoinChallenge, 
  createValidationErrorResponse, 
  createSuccessResponse,
  sanitizeString,
  type JoinChallengeInput
} from '@/lib/validation';
import { 
  verifyAuthToken, 
  checkRateLimit, 
  createAuthErrorResponse, 
  createRateLimitErrorResponse,
} from '@/lib/auth-api';
import { findChallengeByInvitationCode, joinChallenge } from '@/lib/challenges';

// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

// POST /api/challenges/join - Join a challenge using invitation code
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        createAuthErrorResponse(authResult.error || 'Authentication required'),
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Check rate limiting (10 join attempts per hour per user)
    const rateLimitResult = checkRateLimit(
      `join_challenge:${user.uid}`,
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

    // Sanitize and prepare input data
    const joinInput: JoinChallengeInput = {
      invitationCode: sanitizeString(body.invitationCode || '').toUpperCase(),
      userId: user.uid,
      targetWeight: body.targetWeight,
      startWeight: body.startWeight,
      goalType: body.goalType,
    };

    // Validate input
    const validationResult = validateJoinChallenge(joinInput);
    if (!validationResult.isValid) {
      return NextResponse.json(
        createValidationErrorResponse(validationResult.errors),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Find the challenge by invitation code
    const challenge = await findChallengeByInvitationCode(joinInput.invitationCode);
    
    if (!challenge) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'invitationCode',
          message: 'Invalid invitation code. Please check the code and try again.',
          code: 'CHALLENGE_NOT_FOUND'
        }]),
        { 
          status: 404,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Additional business logic validations
    const now = new Date();
    const joinByDate = challenge.joinByDate instanceof Date ? challenge.joinByDate : new Date(challenge.joinByDate);
    const endDate = challenge.endDate instanceof Date ? challenge.endDate : new Date(challenge.endDate);

    // Check if challenge is still accepting participants
    if (now > joinByDate) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challenge',
          message: 'This challenge is no longer accepting new participants. The join deadline has passed.',
          code: 'JOIN_DEADLINE_PASSED'
        }]),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Check if challenge has ended
    if (now > endDate) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challenge',
          message: 'This challenge has already ended.',
          code: 'CHALLENGE_ENDED'
        }]),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Check if challenge is active
    if (!challenge.isActive) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challenge',
          message: 'This challenge is not currently active.',
          code: 'CHALLENGE_INACTIVE'
        }]),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Check if user is already a participant
    if (challenge.participants && challenge.participants.includes(user.uid)) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'user',
          message: 'You are already a participant in this challenge.',
          code: 'ALREADY_PARTICIPANT'
        }]),
        { 
          status: 409,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Check if challenge has reached participant limit
    const currentParticipants = challenge.participants ? challenge.participants.length : challenge.memberCount || 0;
    if (currentParticipants >= challenge.participantLimit) {
      return NextResponse.json(
        createValidationErrorResponse([{
          field: 'challenge',
          message: 'This challenge has reached its participant limit.',
          code: 'PARTICIPANT_LIMIT_REACHED'
        }]),
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Attempt to join the challenge
    try {
      await joinChallenge(challenge.id, user.uid);
    } catch (error) {
      console.error('Error joining challenge:', error);
      
      // Handle specific join errors
      if (error instanceof Error) {
        if (error.message.includes('already a participant')) {
          return NextResponse.json(
            createValidationErrorResponse([{
              field: 'user',
              message: 'You are already a participant in this challenge.',
              code: 'ALREADY_PARTICIPANT'
            }]),
            { 
              status: 409,
              headers: {
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              }
            }
          );
        }
      }
      
      throw error; // Re-throw for general error handling
    }

    // Return success response with challenge information
    const responseChallenge = {
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      startDate: challenge.startDate?.toISOString() || null,
      endDate: challenge.endDate.toISOString(),
      joinByDate: challenge.joinByDate.toISOString(),
      creatorId: challenge.creatorId,
      participantLimit: challenge.participantLimit,
      memberCount: (challenge.memberCount || 0) + 1, // Increment for new member
      participants: [...(challenge.participants || []), user.uid],
    };

    return NextResponse.json(
      createSuccessResponse({
        challenge: responseChallenge,
        userGoal: {
          targetWeight: joinInput.targetWeight,
          startWeight: joinInput.startWeight,
          goalType: joinInput.goalType,
        }
      }, 'Successfully joined the challenge!'),
      { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    );

  } catch (error) {
    console.error('Error joining challenge:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Authentication')) {
        return NextResponse.json(
          createAuthErrorResponse(error.message),
          { status: 401 }
        );
      }
    }
    
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join challenge',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 