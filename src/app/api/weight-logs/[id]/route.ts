import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

// Types for Firebase imports
interface FirebaseImports {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDoc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteDoc: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
}

// Lazy import Firebase to avoid initialization during build
let firebaseImports: FirebaseImports | null = null;

async function getFirebaseImports(): Promise<FirebaseImports> {
  if (!firebaseImports) {
    try {
      const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      firebaseImports = { doc, getDoc, deleteDoc, db };
    } catch (error) {
      console.error('Failed to import Firebase:', error);
      throw new Error('Firebase not available');
    }
  }
  return firebaseImports;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/weight-logs/[id] - Delete a weight log
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { doc, getDoc, deleteDoc, db } = await getFirebaseImports();

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Weight log ID is required' },
        { status: 400 }
      );
    }

    // Get the weight log to verify ownership
    const weightLogRef = doc(db, 'weight_logs', id);
    const weightLogDoc = await getDoc(weightLogRef);

    if (!weightLogDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Weight log not found' },
        { status: 404 }
      );
    }

    const weightLogData = weightLogDoc.data();
    
    // Verify that the user owns this weight log
    if (weightLogData.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this weight log' },
        { status: 403 }
      );
    }

    // Delete the weight log
    await deleteDoc(weightLogRef);

    return NextResponse.json({
      success: true,
      message: 'Weight log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting weight log:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 