import { WeightLog, ApiResponse } from '@/types';
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
  }

  return headers;
}

/**
 * Fetch weight logs for the current user
 */
export async function fetchWeightLogs(limit = 50): Promise<WeightLog[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/weight-logs?limit=${limit}`, {
      headers,
    });
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch weight logs');
    }
    
    // The API returns { success: true, data: { weightLogs: [...], count: number, ... } }
    const weightLogs = result.data.weightLogs || [];
    
    // Convert date strings back to Date objects
    return weightLogs.map((log: any) => ({
      ...log,
      loggedAt: new Date(log.loggedAt),
      createdAt: new Date(log.createdAt),
      updatedAt: new Date(log.updatedAt),
    }));
  } catch (error) {
    console.error('Error fetching weight logs:', error);
    throw error;
  }
}

/**
 * Create a new weight log
 */
export async function createWeightLog(data: {
  weight: number;
  unit?: 'kg' | 'lbs';
  loggedAt: Date;
}): Promise<WeightLog> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/weight-logs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...data,
        loggedAt: data.loggedAt.toISOString(),
      }),
    });

    const result: ApiResponse<WeightLog> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create weight log');
    }
    
    return {
      ...result.data,
      loggedAt: new Date(result.data.loggedAt),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
    };
  } catch (error) {
    console.error('Error creating weight log:', error);
    throw error;
  }
}

/**
 * Update an existing weight log
 */
export async function updateWeightLog(logId: string, data: {
  weight: number;
  unit?: 'kg' | 'lbs';
  loggedAt: Date;
}): Promise<WeightLog> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/weight-logs/${logId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...data,
        loggedAt: data.loggedAt.toISOString(),
      }),
    });

    const result: ApiResponse<{ weightLog: WeightLog }> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update weight log');
    }
    
    return {
      ...result.data.weightLog,
      loggedAt: new Date(result.data.weightLog.loggedAt),
      createdAt: new Date(result.data.weightLog.createdAt),
      updatedAt: new Date(result.data.weightLog.updatedAt),
    };
  } catch (error) {
    console.error('Error updating weight log:', error);
    throw error;
  }
}

/**
 * Delete a weight log
 */
export async function deleteWeightLog(logId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/weight-logs/${logId}`, {
      method: 'DELETE',
      headers,
    });

    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete weight log');
    }
  } catch (error) {
    console.error('Error deleting weight log:', error);
    throw error;
  }
}

/**
 * Calculate progress statistics from weight logs
 */
export function calculateProgressStats(weightLogs: WeightLog[], startWeight?: number) {
  if (weightLogs.length === 0) {
    return {
      totalWeightLoss: 0,
      currentWeight: startWeight || 0,
      daysActive: 0,
      averageWeightLoss: 0,
      progressPercentage: 0,
      lastLoggedDate: null,
      totalLogs: 0,
    };
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...weightLogs].sort((a, b) => 
    new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  const currentWeight = sortedLogs[0].weight;
  const oldestLog = sortedLogs[sortedLogs.length - 1];
  const initialWeight = startWeight || oldestLog.weight;
  
  const totalWeightLoss = initialWeight - currentWeight;
  
  // Calculate days active (unique days with logs)
  const uniqueDays = new Set(
    sortedLogs.map(log => new Date(log.loggedAt).toDateString())
  );
  const daysActive = uniqueDays.size;
  
  // Calculate average weight loss per day
  const daysSinceStart = Math.max(1, Math.ceil(
    (new Date(sortedLogs[0].loggedAt).getTime() - new Date(oldestLog.loggedAt).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const averageWeightLoss = totalWeightLoss / daysSinceStart;
  
  return {
    totalWeightLoss,
    currentWeight,
    daysActive,
    averageWeightLoss,
    progressPercentage: initialWeight > 0 ? (totalWeightLoss / initialWeight) * 100 : 0,
    lastLoggedDate: sortedLogs[0].loggedAt,
    totalLogs: weightLogs.length,
    initialWeight,
  };
}

/**
 * Get weight logs for the user (now global, not per challenge)
 */
export async function fetchAllUserWeightLogs(): Promise<WeightLog[]> {
  try {
    return await fetchWeightLogs();
  } catch (error) {
    console.error('Error fetching user weight logs:', error);
    return [];
  }
}

/**
 * Calculate goal progress based on target weight
 */
export function calculateGoalProgress(
  currentWeight: number, 
  startWeight: number, 
  goalWeight: number
): {
  progressPercentage: number;
  remainingWeight: number;
  isGoalReached: boolean;
} {
  if (startWeight <= goalWeight) {
    return {
      progressPercentage: 0,
      remainingWeight: 0,
      isGoalReached: false,
    };
  }
  
  const totalWeightToLose = startWeight - goalWeight;
  const weightLostSoFar = startWeight - currentWeight;
  const progressPercentage = Math.min(100, Math.max(0, (weightLostSoFar / totalWeightToLose) * 100));
  const remainingWeight = Math.max(0, currentWeight - goalWeight);
  const isGoalReached = currentWeight <= goalWeight;
  
  return {
    progressPercentage,
    remainingWeight,
    isGoalReached,
  };
}

/**
 * Format weight with appropriate unit
 */
export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  return `${weight.toFixed(1)} ${unit}`;
}

/**
 * Convert weight between units
 */
export function convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * 2.20462;
  } else if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight / 2.20462;
  }
  
  return weight;
} 