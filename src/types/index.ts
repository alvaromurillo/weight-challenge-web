// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Challenge types
export interface Challenge {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  invitationCode: string;
  startDate: Date | null;
  endDate: Date;
  joinByDate: Date;
  isActive: boolean;
  isArchived: boolean;
  participants: string[];
  memberCount: number;
  participantLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Weight log types
export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  unit: 'kg' | 'lbs';
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Join request types
export interface JoinRequest {
  id: string;
  challengeId: string;
  userId: string;
  targetWeight: number;
  startWeight: number;
  goalType: 'gain' | 'lose';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // User information (populated when fetching)
  userDisplayName?: string;
  userEmail?: string;
  userPhotoURL?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CreateChallengeForm {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface WeightLogForm {
  weight: number;
  unit: 'kg' | 'lbs';
  loggedAt: string;
}

// Chart data types
export interface ChartDataPoint {
  x: string | Date;
  y: number;
}

export interface ProgressData {
  userId: string;
  userName: string;
  data: ChartDataPoint[];
  currentWeight?: number;
  startWeight?: number;
  weightLoss?: number;
} 