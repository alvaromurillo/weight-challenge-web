import { JoinRequest } from '@/types';
import { auth } from '@/lib/firebase';

/**
 * Get authentication headers for API requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication failed');
    }
  } else {
    throw new Error('User not authenticated');
  }

  return headers;
}

/**
 * Fetch join requests for a specific challenge using API endpoint
 */
export const fetchJoinRequestsForChallenge = async (challengeId: string): Promise<JoinRequest[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/challenges/${challengeId}/join-requests`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch join requests: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch join requests');
    }

    // Convert date strings back to Date objects
    return data.data.joinRequests.map((request: any) => ({
      ...request,
      requestedAt: request.requestedAt ? new Date(request.requestedAt) : new Date(),
      createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
      updatedAt: request.updatedAt ? new Date(request.updatedAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for join requests using polling
 * This replaces the Firestore onSnapshot functionality
 */
export const subscribeToJoinRequests = (
  challengeId: string,
  callback: (joinRequests: JoinRequest[]) => void,
  onError?: (error: Error) => void,
  pollInterval: number = 5000 // 5 seconds
) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const joinRequests = await fetchJoinRequestsForChallenge(challengeId);
      callback(joinRequests);
    } catch (error) {
      console.error('Error in subscribeToJoinRequests:', error);
      if (onError) {
        onError(error as Error);
      }
      // Continue polling even on error, but with longer interval
      if (isActive) {
        setTimeout(poll, pollInterval * 2); // Double the interval on error
        return;
      }
    }
    
    if (isActive) {
      setTimeout(poll, pollInterval);
    }
  };
  
  // Start polling
  poll();
  
  // Return unsubscribe function
  return () => {
    isActive = false;
  };
};

/**
 * Approve a join request using API endpoint
 */
export const approveJoinRequest = async (requestId: string): Promise<{ success: boolean; message: string; membershipId?: string }> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/join-requests/${requestId}/approve`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to approve join request: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to approve join request');
    }

    return {
      success: true,
      message: data.data.message || 'Join request approved successfully',
      membershipId: data.data.requestId
    };
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
};

/**
 * Reject a join request using API endpoint
 */
export const rejectJoinRequest = async (requestId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/join-requests/${requestId}/reject`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to reject join request: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to reject join request');
    }

    return {
      success: true,
      message: data.data.message || 'Join request rejected successfully'
    };
  } catch (error) {
    console.error('Error rejecting join request:', error);
    throw error;
  }
};

/**
 * Request to join a challenge using API endpoint
 * Note: This function would need a corresponding API endpoint to be created
 * For now, it maintains the same interface but could be implemented later
 */
export const requestJoinChallenge = async (
  challengeId: string,
  targetWeight: number,
  startWeight: number,
  goalType: 'gain' | 'lose'
): Promise<{ success: boolean; message: string; requestId?: string }> => {
  try {
    // This would need to be implemented as an API endpoint
    // For now, throwing an error to indicate it's not implemented
    throw new Error('requestJoinChallenge API endpoint not yet implemented');
  } catch (error) {
    console.error('Error requesting to join challenge:', error);
    throw error;
  }
}; 