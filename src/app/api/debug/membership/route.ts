import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

// Types for Firebase imports
interface FirebaseImports {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDoc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDocs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}

interface DebugResult {
  userId: string;
  challengeId: string;
  timestamp: string;
  checks: {
    challengeExists?: boolean;
    challengeData?: {
      name: string;
      isActive: boolean;
      participants: string[];
      userInParticipants: boolean;
    };
    membershipExists?: boolean;
    membershipData?: {
      isActiveMember: boolean;
      joinedAt?: string;
      goalType: string;
      startWeight: number;
      targetWeight: number;
    };
    alternativeMemberships?: Array<{
      documentId: string;
      isActiveMember: boolean;
      joinedAt?: string;
      goalType: string;
    }>;
    weightLogsCount?: number;
    userExists?: boolean;
    userData?: {
      email: string;
      displayName?: string;
    };
  };
}

/**
 * Dynamically import Firebase services
 */
async function getFirebaseImports(): Promise<FirebaseImports> {
  const { collection, doc, getDoc, query, where, getDocs } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  return { collection, doc, getDoc, query, where, getDocs, db };
}

// GET /api/debug/membership - Debug membership status
export async function GET(request: NextRequest) {
  try {
    console.log('Debug membership: Starting request processing');
    
    const user = await getCurrentUser();
    console.log('Debug membership: User authentication result:', user ? 'authenticated' : 'not authenticated');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID is required' },
        { status: 400 }
      );
    }

    console.log('Debug membership: Getting Firebase imports');
    const { collection, doc, getDoc, query, where, getDocs, db } = await getFirebaseImports();
    console.log('Debug membership: Firebase imports successful');

    const result: DebugResult = {
      userId: user.uid,
      challengeId,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check 1: Challenge exists
    console.log('Debug membership: Checking challenge document');
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);
    
    result.checks.challengeExists = challengeDoc.exists();
    if (challengeDoc.exists()) {
      const challengeData = challengeDoc.data();
      result.checks.challengeData = {
        name: challengeData.name,
        isActive: challengeData.isActive,
        participants: challengeData.participants || [],
        userInParticipants: (challengeData.participants || []).includes(user.uid)
      };
    }

    // Check 2: Membership document with expected ID
    console.log('Debug membership: Checking membership document');
    const membershipId = `${user.uid}_${challengeId}`;
    const membershipRef = doc(db, 'challenge_memberships', membershipId);
    const membershipDoc = await getDoc(membershipRef);
    
    result.checks.membershipExists = membershipDoc.exists();
    if (membershipDoc.exists()) {
      const membershipData = membershipDoc.data();
      result.checks.membershipData = {
        isActiveMember: membershipData.isActiveMember,
        joinedAt: membershipData.joinedAt?.toDate()?.toISOString(),
        goalType: membershipData.goalType,
        startWeight: membershipData.startWeight,
        targetWeight: membershipData.targetWeight
      };
    }

    // Check 3: Alternative membership documents
    console.log('Debug membership: Searching for alternative membership documents');
    const membershipQuery = query(
      collection(db, 'challenge_memberships'),
      where('userId', '==', user.uid),
      where('challengeId', '==', challengeId)
    );
    const membershipQuerySnapshot = await getDocs(membershipQuery);
    
    result.checks.alternativeMemberships = [];
    membershipQuerySnapshot.forEach((docSnapshot: any) => {
      const data = docSnapshot.data();
      result.checks.alternativeMemberships!.push({
        documentId: docSnapshot.id,
        isActiveMember: data.isActiveMember,
        joinedAt: data.joinedAt?.toDate()?.toISOString(),
        goalType: data.goalType
      });
    });

    // Check 4: Weight logs count
    console.log('Debug membership: Checking weight logs');
    const weightLogsQuery = query(
      collection(db, 'weight_logs'),
      where('userId', '==', user.uid),
      where('challengeId', '==', challengeId)
    );
    const weightLogsSnapshot = await getDocs(weightLogsQuery);
    result.checks.weightLogsCount = weightLogsSnapshot.docs.length;

    // Check 5: User document
    console.log('Debug membership: Checking user document');
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    result.checks.userExists = userDoc.exists();
    if (userDoc.exists()) {
      const userData = userDoc.data();
      result.checks.userData = {
        email: userData.email,
        displayName: userData.displayName
      };
    }

    console.log('Debug membership: Returning debug information');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in debug membership:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 