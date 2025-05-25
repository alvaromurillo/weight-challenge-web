import { Challenge, WeightLog, User } from '@/types';
import { auth } from '@/lib/firebase';

// Import types from challenges.ts
import type { ParticipantData } from './challenges';

// API-based functions that replace direct Firestore queries

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
 * Fetch challenges where user is a participant using API endpoint
 */
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/challenges/user/${userId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user challenges: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user challenges');
    }

    // Convert date strings back to Date objects
    return data.data.challenges.map((challenge: any) => ({
      ...challenge,
      startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
      endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(),
      joinByDate: challenge.joinByDate ? new Date(challenge.joinByDate) : new Date(),
      createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
      updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    throw error;
  }
};

/**
 * Fetch a single challenge by ID using API endpoint
 */
export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/challenges/${challengeId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch challenge: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch challenge');
    }

    const challenge = data.data.challenge;
    
    // Convert date strings back to Date objects
    return {
      ...challenge,
      startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
      endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(),
      joinByDate: challenge.joinByDate ? new Date(challenge.joinByDate) : new Date(),
      createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
      updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date(),
    };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};

/**
 * Fetch user weight logs for a specific challenge using API endpoint
 */
export const getUserWeightLogs = async (userId: string, challengeId: string): Promise<WeightLog[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/weight-logs/user/${userId}/${challengeId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user weight logs: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user weight logs');
    }

    // Convert date strings back to Date objects
    return data.data.weightLogs.map((log: any) => ({
      ...log,
      loggedAt: log.loggedAt ? new Date(log.loggedAt) : new Date(),
      createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
      updatedAt: log.updatedAt ? new Date(log.updatedAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching user weight logs:', error);
    throw error;
  }
};

/**
 * Fetch all weight logs for a challenge using API endpoint
 */
export const getChallengeWeightLogs = async (challengeId: string): Promise<WeightLog[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/weight-logs/challenge/${challengeId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch challenge weight logs: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch challenge weight logs');
    }

    // Convert date strings back to Date objects
    return data.data.weightLogs.map((log: any) => ({
      ...log,
      loggedAt: log.loggedAt ? new Date(log.loggedAt) : new Date(),
      createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
      updatedAt: log.updatedAt ? new Date(log.updatedAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching challenge weight logs:', error);
    throw error;
  }
};

/**
 * Find challenge by invitation code using API endpoint
 */
export const findChallengeByInvitationCode = async (invitationCode: string): Promise<Challenge | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/challenges/invitation/${invitationCode.toUpperCase()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to find challenge: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to find challenge');
    }

    const challenge = data.data.challenge;
    
    // Convert date strings back to Date objects
    return {
      ...challenge,
      startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
      endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(),
      joinByDate: challenge.joinByDate ? new Date(challenge.joinByDate) : new Date(),
      createdAt: challenge.createdAt ? new Date(challenge.createdAt) : new Date(),
      updatedAt: challenge.updatedAt ? new Date(challenge.updatedAt) : new Date(),
    };
  } catch (error) {
    console.error('Error finding challenge by invitation code:', error);
    throw error;
  }
};

/**
 * Join a challenge using API endpoint
 */
export const joinChallenge = async (challengeId: string, userId: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch('/api/challenges/join', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        challengeId,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to join challenge: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to join challenge');
    }

    // Success - no return value needed
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }
};

/**
 * Real-time listener for user challenges using polling
 * This replaces the Firestore onSnapshot functionality
 */
export const subscribeToUserChallenges = (
  userId: string, 
  callback: (challenges: Challenge[]) => void,
  pollInterval: number = 5000 // 5 seconds
) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const challenges = await getUserChallenges(userId);
      callback(challenges);
    } catch (error) {
      console.error('Error in subscribeToUserChallenges:', error);
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
 * Real-time listener for a specific challenge using polling
 * This replaces the Firestore onSnapshot functionality
 */
export const subscribeToChallenge = (
  challengeId: string,
  callback: (challenge: Challenge | null) => void,
  pollInterval: number = 5000 // 5 seconds
) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const challenge = await getChallenge(challengeId);
      callback(challenge);
    } catch (error) {
      console.error('Error in subscribeToChallenge:', error);
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
 * Real-time listener for user weight logs in a specific challenge using polling
 * This replaces the Firestore onSnapshot functionality
 */
export const subscribeToUserWeightLogs = (
  userId: string,
  challengeId: string,
  callback: (weightLogs: WeightLog[]) => void,
  pollInterval: number = 5000 // 5 seconds
) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const weightLogs = await getUserWeightLogs(userId, challengeId);
      callback(weightLogs);
    } catch (error) {
      console.error('Error in subscribeToUserWeightLogs:', error);
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
 * Real-time listener for all weight logs in a challenge using polling
 * This replaces the Firestore onSnapshot functionality
 */
export const subscribeToChallengeWeightLogs = (
  challengeId: string,
  callback: (weightLogs: WeightLog[]) => void,
  pollInterval: number = 5000 // 5 seconds
) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const weightLogs = await getChallengeWeightLogs(challengeId);
      callback(weightLogs);
    } catch (error) {
      console.error('Error in subscribeToChallengeWeightLogs:', error);
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
 * Get challenge participants using API endpoint
 */
export const getChallengeParticipants = async (challengeId: string, participantIds: string[]): Promise<ParticipantData[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/challenges/${challengeId}/participants`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch challenge participants: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch challenge participants');
    }

    // Convert date strings back to Date objects
    return data.data.participants.map((participant: any) => ({
      ...participant,
      lastLoggedAt: participant.lastLoggedAt ? new Date(participant.lastLoggedAt) : null,
      user: {
        ...participant.user,
        createdAt: new Date(participant.user.createdAt),
        updatedAt: new Date(participant.user.updatedAt),
      },
      weightLogs: participant.weightLogs.map((log: any) => ({
        ...log,
        loggedAt: new Date(log.loggedAt),
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
      })),
    }));
  } catch (error) {
    console.error('Error fetching challenge participants:', error);
    throw error;
  }
};

/**
 * Get user's latest weight for a challenge using API endpoint
 */
export const getUserLatestWeight = async (userId: string, challengeId: string): Promise<number | null> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`/api/weight-logs/user/${userId}/${challengeId}?latest=true`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest weight: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch latest weight');
    }

    return data.data.latestWeight;
  } catch (error) {
    console.error('Error fetching latest weight:', error);
    return null;
  }
};

// Re-export utility functions and types that don't require Firestore access
export { 
  getChallengeStatus,
  type ParticipantData,
  type ChallengeFilters,
  getDefaultChallengeFilters,
  filterAndSortChallenges
} from './challenges'; 