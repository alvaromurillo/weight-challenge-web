import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  onSnapshot,
  documentId,
  updateDoc,
  arrayUnion,
  addDoc,
  Timestamp,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Challenge, WeightLog, User } from '../types';
import { auth } from './firebase';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: unknown): Date => {
  // Handle null, undefined, or empty values
  if (!timestamp) {
    return new Date(); // Return current date as fallback
  }
  
  // Handle Firestore Timestamp objects
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Handle Firestore Timestamp objects with seconds/nanoseconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    const ts = timestamp as { seconds: number; nanoseconds?: number };
    return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
  }
  
  // Handle string, number, or Date values
  const date = new Date(timestamp as string | number | Date);
  
  // Check if the resulting date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp received:', timestamp, 'Using current date as fallback');
    return new Date(); // Return current date as fallback
  }
  
  return date;
};

// Fetch challenges where user is a participant
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const challengesRef = collection(db, 'challenges');
    const q = query(
      challengesRef,
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const challenges: Challenge[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      challenges.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        creatorId: data.creatorId,
        invitationCode: data.invitationCode,
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
        joinByDate: convertTimestamp(data.joinByDate),
        isActive: data.isActive,
        isArchived: data.isArchived || false,
        participants: data.participants || [],
        memberCount: data.memberCount || 0,
        participantLimit: data.participantLimit || 10,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    return challenges;
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    throw error;
  }
};

// Fetch a single challenge by ID
export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);
    
    if (!challengeSnap.exists()) {
      return null;
    }
    
    const data = challengeSnap.data();
    return {
      id: challengeSnap.id,
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      invitationCode: data.invitationCode,
      startDate: convertTimestamp(data.startDate),
      endDate: convertTimestamp(data.endDate),
      joinByDate: convertTimestamp(data.joinByDate),
      isActive: data.isActive,
      isArchived: data.isArchived || false,
      participants: data.participants || [],
      memberCount: data.memberCount || 0,
      participantLimit: data.participantLimit || 10,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw error;
  }
};

// Get weight logs for a user in a specific challenge
export const getUserWeightLogs = async (userId: string, challengeId: string): Promise<WeightLog[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const weightLogsRef = collection(db, 'weight_logs');
    const q = query(
      weightLogsRef,
      where('userId', '==', userId),
      where('challengeId', '==', challengeId),
      orderBy('weighedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const weightLogs: WeightLog[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      weightLogs.push({
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit,
        loggedAt: convertTimestamp(data.weighedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    return weightLogs;
  } catch (error) {
    console.error('Error fetching weight logs:', error);
    throw error;
  }
};

// Get all weight logs for a challenge (for dashboard)
export const getChallengeWeightLogs = async (challengeId: string): Promise<WeightLog[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const weightLogsRef = collection(db, 'weight_logs');
    const q = query(
      weightLogsRef,
      where('challengeId', '==', challengeId),
      orderBy('weighedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const weightLogs: WeightLog[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      weightLogs.push({
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit,
        loggedAt: convertTimestamp(data.weighedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    return weightLogs;
  } catch (error) {
    console.error('Error fetching challenge weight logs:', error);
    throw error;
  }
};

// Real-time listener for user challenges
export const subscribeToUserChallenges = (
  userId: string, 
  callback: (challenges: Challenge[]) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized');
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
  
  const challengesRef = collection(db, 'challenges');
  const q = query(
    challengesRef,
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const challenges: Challenge[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      challenges.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        creatorId: data.creatorId,
        invitationCode: data.invitationCode,
        startDate: convertTimestamp(data.startDate),
        endDate: convertTimestamp(data.endDate),
        joinByDate: convertTimestamp(data.joinByDate),
        isActive: data.isActive,
        isArchived: data.isArchived || false,
        participants: data.participants || [],
        memberCount: data.memberCount || 0,
        participantLimit: data.participantLimit || 10,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    callback(challenges);
  });
};

// Real-time listener for a specific challenge
export const subscribeToChallenge = (
  challengeId: string,
  callback: (challenge: Challenge | null) => void
) => {
  if (!db) {
    console.warn('Firestore not initialized');
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  
  const challengeRef = doc(db, 'challenges', challengeId);
  
  return onSnapshot(challengeRef, (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }
    
    const data = doc.data();
    const challenge: Challenge = {
      id: doc.id,
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      invitationCode: data.invitationCode,
      startDate: convertTimestamp(data.startDate),
      endDate: convertTimestamp(data.endDate),
      joinByDate: convertTimestamp(data.joinByDate),
      isActive: data.isActive,
      isArchived: data.isArchived || false,
      participants: data.participants || [],
      memberCount: data.memberCount || 0,
      participantLimit: data.participantLimit || 10,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
    
    callback(challenge);
  });
};

// Real-time listener for user's weight logs in a specific challenge
export const subscribeToUserWeightLogs = (
  userId: string,
  challengeId: string,
  callback: (weightLogs: WeightLog[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const weightLogsRef = collection(db, 'weight_logs');
  const q = query(
    weightLogsRef,
    where('userId', '==', userId),
    where('challengeId', '==', challengeId),
    orderBy('weighedAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const weightLogs: WeightLog[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      weightLogs.push({
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit,
        loggedAt: convertTimestamp(data.weighedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    callback(weightLogs);
  });
};

// Real-time listener for all weight logs in a challenge
export const subscribeToChallengeWeightLogs = (
  challengeId: string,
  callback: (weightLogs: WeightLog[]) => void
): (() => void) => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const weightLogsRef = collection(db, 'weight_logs');
  const q = query(
    weightLogsRef,
    where('challengeId', '==', challengeId),
    orderBy('weighedAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const weightLogs: WeightLog[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      weightLogs.push({
        id: doc.id,
        userId: data.userId,
        challengeId: data.challengeId,
        weight: data.weight,
        unit: data.unit,
        loggedAt: convertTimestamp(data.weighedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    callback(weightLogs);
  });
};

// Calculate challenge status
export const getChallengeStatus = (challenge: Challenge): 'upcoming' | 'active' | 'completed' => {
  const now = new Date();
  const endDate = new Date(challenge.endDate);
  
  // If startDate is null, consider the challenge as active if it hasn't ended
  if (!challenge.startDate) {
    return now > endDate ? 'completed' : 'active';
  }
  
  const startDate = new Date(challenge.startDate);
  
  if (now < startDate) {
    return 'upcoming';
  } else if (now > endDate) {
    return 'completed';
  } else {
    return 'active';
  }
};

// Get user's latest weight for a challenge
export const getUserLatestWeight = async (userId: string, challengeId: string): Promise<number | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const weightLogsRef = collection(db, 'weight_logs');
    const q = query(
      weightLogsRef,
      where('userId', '==', userId),
      where('challengeId', '==', challengeId),
      orderBy('weighedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const latestLog = querySnapshot.docs[0].data();
    return latestLog.weight;
  } catch (error) {
    console.error('Error fetching latest weight:', error);
    return null;
  }
};

// Get user information by ID
export const getUser = async (userId: string): Promise<User | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    const data = userSnap.data();
    return {
      id: userSnap.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Get multiple users by their IDs
export const getUsers = async (userIds: string[]): Promise<User[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    if (userIds.length === 0) return [];
    
    // Firestore 'in' queries are limited to 10 items, so we need to batch
    const batches: string[][] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10));
    }
    
    const users: User[] = [];
    
    for (const batch of batches) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where(documentId(), 'in', batch));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Participant data with weight information
export interface ParticipantData {
  user: User;
  latestWeight: number | null;
  weightLogs: WeightLog[];
  startWeight: number | null;
  weightLoss: number | null;
  lastLoggedAt: Date | null;
}

// Get participant data for a challenge
export const getChallengeParticipants = async (challengeId: string, participantIds: string[]): Promise<ParticipantData[]> => {
  try {
    // Fetch all users
    const users = await getUsers(participantIds);
    
    // Fetch all weight logs for the challenge
    const allWeightLogs = await getChallengeWeightLogs(challengeId);
    
    // Group weight logs by user
    const weightLogsByUser = allWeightLogs.reduce((acc, log) => {
      if (!acc[log.userId]) {
        acc[log.userId] = [];
      }
      acc[log.userId].push(log);
      return acc;
    }, {} as Record<string, WeightLog[]>);
    
    // Build participant data
    const participants: ParticipantData[] = users.map(user => {
      const userLogs = weightLogsByUser[user.id] || [];
      const sortedLogs = userLogs.sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
      
      const startWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : null;
      const latestWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weight : null;
      const weightLoss = startWeight && latestWeight ? startWeight - latestWeight : null;
      const lastLoggedAt = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].loggedAt : null;
      
      return {
        user,
        latestWeight,
        weightLogs: userLogs,
        startWeight,
        weightLoss,
        lastLoggedAt,
      };
    });
    
    // Sort by weight loss (descending) - those with more weight loss first
    return participants.sort((a, b) => {
      if (a.weightLoss === null && b.weightLoss === null) return 0;
      if (a.weightLoss === null) return 1;
      if (b.weightLoss === null) return -1;
      return b.weightLoss - a.weightLoss;
    });
  } catch (error) {
    console.error('Error fetching challenge participants:', error);
    return [];
  }
};

// Find challenge by invitation code
export const findChallengeByInvitationCode = async (invitationCode: string): Promise<Challenge | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const challengesRef = collection(db, 'challenges');
    const q = query(
      challengesRef,
      where('invitationCode', '==', invitationCode.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the first matching challenge
    const challengeDoc = querySnapshot.docs[0];
    const data = challengeDoc.data();
    
    return {
      id: challengeDoc.id,
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      invitationCode: data.invitationCode,
      startDate: convertTimestamp(data.startDate),
      endDate: convertTimestamp(data.endDate),
      joinByDate: convertTimestamp(data.joinByDate),
      isActive: data.isActive,
      isArchived: data.isArchived || false,
      participants: data.participants || [],
      memberCount: data.memberCount || 0,
      participantLimit: data.participantLimit || 10,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    };
  } catch (error) {
    console.error('Error finding challenge by invitation code:', error);
    throw error;
  }
};

// Join a challenge by adding user to participants
export const joinChallenge = async (challengeId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    
    // Check if challenge exists and user is not already a participant
    const challengeSnap = await getDoc(challengeRef);
    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    if (challengeData.participants && challengeData.participants.includes(userId)) {
      throw new Error('You are already a participant in this challenge');
    }
    
    // Check if challenge is still active and hasn't ended
    const endDate = convertTimestamp(challengeData.endDate);
    if (new Date() > endDate) {
      throw new Error('This challenge has already ended');
    }
    
    // Add user to participants array
    await updateDoc(challengeRef, {
      participants: arrayUnion(userId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }
};

// Debug function to check challenges in Firestore
export const debugUserChallenges = async (userId: string): Promise<void> => {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }
  
  try {
    console.log('🔍 Debug: Checking challenges for user:', userId);
    
    // Check all challenges where user is creator
    const creatorQuery = query(
      collection(db, 'challenges'),
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const creatorSnapshot = await getDocs(creatorQuery);
    console.log('📝 Challenges created by user:', creatorSnapshot.size);
    
    creatorSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Created challenge:', {
        id: doc.id,
        name: data.name,
        creatorId: data.creatorId,
        participants: data.participants,
        isActive: data.isActive,
        createdAt: data.createdAt
      });
    });
    
    // Check all challenges where user is in participants array
    const participantQuery = query(
      collection(db, 'challenges'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const participantSnapshot = await getDocs(participantQuery);
    console.log('👥 Challenges where user is participant:', participantSnapshot.size);
    
    participantSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Participant in challenge:', {
        id: doc.id,
        name: data.name,
        creatorId: data.creatorId,
        participants: data.participants,
        isActive: data.isActive,
        createdAt: data.createdAt
      });
    });
    
    // Check all challenges (no filter)
    const allQuery = query(
      collection(db, 'challenges'),
      orderBy('createdAt', 'desc')
    );
    
    const allSnapshot = await getDocs(allQuery);
    console.log('🌍 Total challenges in database:', allSnapshot.size);
    
  } catch (error) {
    console.error('❌ Error in debug function:', error);
  }
};

export const addWeightLog = async (challengeId: string, weight: number, unit: 'kg' | 'lbs' = 'kg', weighedAt: Date = new Date()): Promise<string> => {
  if (!db || !auth?.currentUser) {
    throw new Error('Not authenticated or Firestore not initialized');
  }
  
  try {
    const weightLogsRef = collection(db, 'weight_logs');
    const weightLogData = {
      userId: auth.currentUser.uid,
      challengeId,
      weight,
      unit,
      weighedAt: Timestamp.fromDate(weighedAt),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(weightLogsRef, weightLogData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding weight log:', error);
    throw error;
  }
};

// Archive a challenge (only creator can archive)
export const archiveChallenge = async (challengeId: string): Promise<void> => {
  if (!db || !auth?.currentUser) {
    throw new Error('Not authenticated or Firestore not initialized');
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    
    // Check if challenge exists and user is the creator
    const challengeSnap = await getDoc(challengeRef);
    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    if (challengeData.creatorId !== auth.currentUser.uid) {
      throw new Error('Only the challenge creator can archive this challenge');
    }
    
    // Update challenge to archived status
    await updateDoc(challengeRef, {
      isArchived: true,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error archiving challenge:', error);
    throw error;
  }
};

// Unarchive a challenge (only creator can unarchive)
export const unarchiveChallenge = async (challengeId: string): Promise<void> => {
  if (!db || !auth?.currentUser) {
    throw new Error('Not authenticated or Firestore not initialized');
  }
  
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    
    // Check if challenge exists and user is the creator
    const challengeSnap = await getDoc(challengeRef);
    if (!challengeSnap.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challengeData = challengeSnap.data();
    if (challengeData.creatorId !== auth.currentUser.uid) {
      throw new Error('Only the challenge creator can unarchive this challenge');
    }
    
    // Update challenge to unarchived status
    await updateDoc(challengeRef, {
      isArchived: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error unarchiving challenge:', error);
    throw error;
  }
};

// Challenge filtering and sorting utilities
export interface ChallengeFilters {
  searchTerm: string;
  status: 'all' | 'active' | 'upcoming' | 'completed';
  archived: 'all' | 'active' | 'archived';
  sortBy: 'name' | 'createdAt' | 'startDate' | 'endDate' | 'participants';
  sortOrder: 'asc' | 'desc';
}

export const filterAndSortChallenges = (
  challenges: Challenge[],
  filters: ChallengeFilters
): Challenge[] => {
  let filteredChallenges = [...challenges];

  // Apply search filter
  if (filters.searchTerm.trim()) {
    const searchTerm = filters.searchTerm.toLowerCase().trim();
    filteredChallenges = filteredChallenges.filter(challenge => 
      challenge.name.toLowerCase().includes(searchTerm) ||
      (challenge.description && challenge.description.toLowerCase().includes(searchTerm))
    );
  }

  // Apply archived filter
  if (filters.archived !== 'all') {
    filteredChallenges = filteredChallenges.filter(challenge => {
      if (filters.archived === 'archived') {
        return challenge.isArchived;
      } else {
        return !challenge.isArchived;
      }
    });
  }

  // Apply status filter
  if (filters.status !== 'all') {
    filteredChallenges = filteredChallenges.filter(challenge => {
      const status = getChallengeStatus(challenge);
      return status === filters.status;
    });
  }

  // Apply sorting
  filteredChallenges.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'startDate':
        const aStartDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bStartDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        comparison = aStartDate - bStartDate;
        break;
      case 'endDate':
        comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        break;
      case 'participants':
        comparison = a.participants.length - b.participants.length;
        break;
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filteredChallenges;
};

// Get default filters
export const getDefaultChallengeFilters = (): ChallengeFilters => ({
  searchTerm: '',
  status: 'all',
  archived: 'active',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}); 