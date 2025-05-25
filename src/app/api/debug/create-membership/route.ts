import { NextRequest, NextResponse } from 'next/server';

// GET /api/debug/create-membership - Call Cloud Function to create test membership
export async function GET() {
  try {
    console.log('Debug create membership: Starting request');
    
    // Import Firebase functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const getFirebaseApp = (await import('@/lib/firebase')).default;
    
    const functions = getFunctions(getFirebaseApp());
    const createTestMembership = httpsCallable(functions, 'createTestMembership');
    
    console.log('Debug create membership: Calling Cloud Function');
    const result = await createTestMembership({});
    
    console.log('Debug create membership: Cloud Function result:', result.data);

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error calling createTestMembership:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 