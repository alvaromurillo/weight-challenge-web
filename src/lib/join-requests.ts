import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  Unsubscribe,
  // updateDoc, // Removed unused import
  // deleteDoc, // Removed unused import
  // Timestamp // Removed unused import
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { JoinRequest } from '../types';

/**
 * Fetch join requests for a specific challenge
 * Only challenge creators can access this data
 */
export async function fetchJoinRequestsForChallenge(challengeId: string): Promise<JoinRequest[]> {
  try {
    const joinRequestsRef = collection(db, 'join_requests');
    const q = query(
      joinRequestsRef,
      where('challengeId', '==', challengeId),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const joinRequests: JoinRequest[] = [];
          
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            
            // Fetch user information for the requester
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            
            const joinRequest: JoinRequest = {
              id: docSnapshot.id,
              challengeId: data.challengeId,
              userId: data.userId,
              targetWeight: data.targetWeight,
              startWeight: data.startWeight,
              goalType: data.goalType,
              status: data.status,
              requestedAt: data.requestedAt.toDate(),
              createdAt: data.requestedAt.toDate(), // Using requestedAt as createdAt
              updatedAt: data.requestedAt.toDate(), // Using requestedAt as updatedAt
              // User information
              userDisplayName: userData?.displayName || userData?.email || 'Unknown User',
              userEmail: userData?.email,
              userPhotoURL: userData?.photoURL,
            };
            
            joinRequests.push(joinRequest);
          }
          
          unsubscribe();
          resolve(joinRequests);
        } catch (error) {
          unsubscribe();
          reject(error);
        }
      }, (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for join requests of a challenge
 */
export function subscribeToJoinRequests(
  challengeId: string,
  callback: (joinRequests: JoinRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const joinRequestsRef = collection(db, 'join_requests');
  const q = query(
    joinRequestsRef,
    where('challengeId', '==', challengeId),
    where('status', '==', 'pending'),
    orderBy('requestedAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      const joinRequests: JoinRequest[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Fetch user information for the requester
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const joinRequest: JoinRequest = {
          id: docSnapshot.id,
          challengeId: data.challengeId,
          userId: data.userId,
          targetWeight: data.targetWeight,
          startWeight: data.startWeight,
          goalType: data.goalType,
          status: data.status,
          requestedAt: data.requestedAt.toDate(),
          createdAt: data.requestedAt.toDate(),
          updatedAt: data.requestedAt.toDate(),
          // User information
          userDisplayName: userData?.displayName || userData?.email || 'Unknown User',
          userEmail: userData?.email,
          userPhotoURL: userData?.photoURL,
        };
        
        joinRequests.push(joinRequest);
      }
      
      callback(joinRequests);
    } catch (error) {
      console.error('Error in join requests subscription:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, (error) => {
    console.error('Error subscribing to join requests:', error);
    if (onError) {
      onError(error);
    }
  });
}

/**
 * Approve a join request
 * Only challenge creators can approve requests
 */
export async function approveJoinRequest(requestId: string): Promise<{ success: boolean; message: string; membershipId?: string }> {
  try {
    const approveJoinRequestFn = httpsCallable(functions, 'approveJoinRequest');
    const result = await approveJoinRequestFn({ requestId });
    
    return result.data as { success: boolean; message: string; membershipId?: string };
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
}

/**
 * Reject a join request
 * Only challenge creators can reject requests
 */
export async function rejectJoinRequest(requestId: string): Promise<{ success: boolean; message: string }> {
  try {
    const rejectJoinRequestFn = httpsCallable(functions, 'rejectJoinRequest');
    const result = await rejectJoinRequestFn({ requestId });
    
    return result.data as { success: boolean; message: string };
  } catch (error) {
    console.error('Error rejecting join request:', error);
    throw error;
  }
}

/**
 * Request to join a challenge
 * Creates a join request that needs approval from the challenge creator
 */
export async function requestJoinChallenge(
  challengeId: string,
  targetWeight: number,
  startWeight: number,
  goalType: 'gain' | 'lose'
): Promise<{ success: boolean; message: string; requestId?: string }> {
  try {
    const requestJoinChallengeFn = httpsCallable(functions, 'requestJoinChallenge');
    const result = await requestJoinChallengeFn({
      challengeId,
      targetWeight,
      startWeight,
      goalType
    });
    
    return result.data as { success: boolean; message: string; requestId?: string };
  } catch (error) {
    console.error('Error requesting to join challenge:', error);
    throw error;
  }
} 