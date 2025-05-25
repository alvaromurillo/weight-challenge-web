/**
 * Server-side validation utilities for the web application
 * This mirrors the validation logic from Firebase Functions to ensure consistency
 */

// Types for validation
export type GoalType = 'gain' | 'lose';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// Validation constants
export const VALIDATION_CONSTANTS = {
  WEIGHT: {
    MIN: 20, // kg
    MAX: 500, // kg
  },
  PARTICIPANT_LIMIT: {
    DEFAULT: 10,
    MAX: 10, // Fixed for Phase 1
  },
  INVITATION_CODE: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 8,
  },
  STRING_LENGTHS: {
    CHALLENGE_NAME: { MIN: 3, MAX: 100 },
    CHALLENGE_DESCRIPTION: { MIN: 10, MAX: 500 },
    DISPLAY_NAME: { MAX: 100 },
    USER_ID: { MAX: 255 },
  },
} as const;

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Email validation using a simple regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Weight validation
 */
export function isValidWeight(weight: number): boolean {
  return (
    typeof weight === 'number' &&
    !isNaN(weight) &&
    weight >= VALIDATION_CONSTANTS.WEIGHT.MIN &&
    weight <= VALIDATION_CONSTANTS.WEIGHT.MAX &&
    Number.isFinite(weight)
  );
}

/**
 * Goal type validation
 */
export function isValidGoalType(goalType: string): goalType is GoalType {
  return goalType === 'gain' || goalType === 'lose';
}

/**
 * Join request status validation
 */
export function isValidJoinRequestStatus(status: string): status is JoinRequestStatus {
  return ['pending', 'approved', 'rejected', 'expired'].includes(status);
}

/**
 * Invitation code validation
 */
export function isValidInvitationCode(code: string): boolean {
  const { MIN_LENGTH, MAX_LENGTH } = VALIDATION_CONSTANTS.INVITATION_CODE;
  return (
    typeof code === 'string' &&
    code.length >= MIN_LENGTH &&
    code.length <= MAX_LENGTH &&
    /^[A-Za-z0-9]+$/.test(code)
  );
}

/**
 * Date validation - checks if date is valid and not in the past
 */
export function isValidFutureDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime()) && date > new Date();
}

/**
 * Validate that end date is after join by date
 */
export function isEndDateAfterJoinByDate(endDate: Date, joinByDate: Date): boolean {
  return endDate > joinByDate;
}

/**
 * Participant limit validation
 */
export function isValidParticipantLimit(limit: number): boolean {
  return (
    typeof limit === 'number' &&
    Number.isInteger(limit) &&
    limit > 0 &&
    limit <= VALIDATION_CONSTANTS.PARTICIPANT_LIMIT.MAX
  );
}

/**
 * String validation - checks if string is non-empty and within reasonable length
 */
export function isValidString(str: string, maxLength: number = 255, minLength: number = 1): boolean {
  return typeof str === 'string' && 
         str.trim().length >= minLength && 
         str.length <= maxLength;
}

/**
 * Validate goal consistency (target weight aligns with goal type)
 */
export function isGoalConsistent(goalType: GoalType, startWeight: number, targetWeight: number): boolean {
  if (goalType === 'lose') {
    return targetWeight < startWeight;
  } else {
    return targetWeight > startWeight;
  }
}

// Input interfaces for validation
export interface CreateChallengeInput {
  name: string;
  description: string;
  endDate: string | Date;
  joinByDate: string | Date;
  targetWeight: number;
  startWeight: number;
  goalType: GoalType;
  participantLimit?: number;
}

export interface JoinChallengeInput {
  invitationCode: string;
  userId: string;
  targetWeight: number;
  startWeight: number;
  goalType: GoalType;
}

export interface CreateWeightLogInput {
  challengeId: string;
  weight: number;
  unit?: 'kg' | 'lbs';
  loggedAt: string | Date;
}

export interface UpdateChallengeInput {
  name?: string;
  description?: string;
  participantLimit?: number;
}

/**
 * Validate challenge creation input
 */
export function validateCreateChallenge(input: CreateChallengeInput): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = [];

  // Validate name
  if (!isValidString(input.name, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MAX, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MIN)) {
    errors.push({
      field: 'name',
      message: `Challenge name must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MIN} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MAX} characters`,
      code: 'INVALID_NAME_LENGTH'
    });
  }

  // Validate description
  if (!isValidString(input.description, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MAX, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MIN)) {
    errors.push({
      field: 'description',
      message: `Challenge description must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MIN} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MAX} characters`,
      code: 'INVALID_DESCRIPTION_LENGTH'
    });
  }

  // Validate dates
  const endDate = new Date(input.endDate);
  const joinByDate = new Date(input.joinByDate);

  if (!isValidFutureDate(endDate)) {
    errors.push({
      field: 'endDate',
      message: 'End date must be a valid future date',
      code: 'INVALID_END_DATE'
    });
  }

  if (!isValidFutureDate(joinByDate)) {
    errors.push({
      field: 'joinByDate',
      message: 'Join by date must be a valid future date',
      code: 'INVALID_JOIN_BY_DATE'
    });
  }

  if (isValidFutureDate(endDate) && isValidFutureDate(joinByDate) && !isEndDateAfterJoinByDate(endDate, joinByDate)) {
    errors.push({
      field: 'endDate',
      message: 'End date must be after join by date',
      code: 'END_DATE_BEFORE_JOIN_DATE'
    });
  }

  // Validate weights
  if (!isValidWeight(input.targetWeight)) {
    errors.push({
      field: 'targetWeight',
      message: `Target weight must be between ${VALIDATION_CONSTANTS.WEIGHT.MIN} and ${VALIDATION_CONSTANTS.WEIGHT.MAX} kg`,
      code: 'INVALID_TARGET_WEIGHT'
    });
  }

  if (!isValidWeight(input.startWeight)) {
    errors.push({
      field: 'startWeight',
      message: `Start weight must be between ${VALIDATION_CONSTANTS.WEIGHT.MIN} and ${VALIDATION_CONSTANTS.WEIGHT.MAX} kg`,
      code: 'INVALID_START_WEIGHT'
    });
  }

  // Validate goal type
  if (!isValidGoalType(input.goalType)) {
    errors.push({
      field: 'goalType',
      message: 'Goal type must be either "gain" or "lose"',
      code: 'INVALID_GOAL_TYPE'
    });
  }

  // Validate goal consistency
  if (isValidWeight(input.targetWeight) && isValidWeight(input.startWeight) && isValidGoalType(input.goalType)) {
    if (!isGoalConsistent(input.goalType, input.startWeight, input.targetWeight)) {
      errors.push({
        field: 'targetWeight',
        message: input.goalType === 'lose' 
          ? 'For weight loss goals, target weight must be less than start weight'
          : 'For weight gain goals, target weight must be greater than start weight',
        code: 'GOAL_WEIGHT_INCONSISTENT'
      });
    }
  }

  // Validate participant limit
  if (input.participantLimit !== undefined && !isValidParticipantLimit(input.participantLimit)) {
    errors.push({
      field: 'participantLimit',
      message: `Participant limit must be a positive integer not exceeding ${VALIDATION_CONSTANTS.PARTICIPANT_LIMIT.MAX}`,
      code: 'INVALID_PARTICIPANT_LIMIT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate join challenge input
 */
export function validateJoinChallenge(input: JoinChallengeInput): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = [];

  // Validate invitation code
  if (!isValidInvitationCode(input.invitationCode)) {
    errors.push({
      field: 'invitationCode',
      message: `Invitation code must be ${VALIDATION_CONSTANTS.INVITATION_CODE.MIN_LENGTH}-${VALIDATION_CONSTANTS.INVITATION_CODE.MAX_LENGTH} alphanumeric characters`,
      code: 'INVALID_INVITATION_CODE'
    });
  }

  // Validate user ID
  if (!isValidString(input.userId, VALIDATION_CONSTANTS.STRING_LENGTHS.USER_ID.MAX)) {
    errors.push({
      field: 'userId',
      message: 'User ID must be a non-empty string',
      code: 'INVALID_USER_ID'
    });
  }

  // Validate weights
  if (!isValidWeight(input.targetWeight)) {
    errors.push({
      field: 'targetWeight',
      message: `Target weight must be between ${VALIDATION_CONSTANTS.WEIGHT.MIN} and ${VALIDATION_CONSTANTS.WEIGHT.MAX} kg`,
      code: 'INVALID_TARGET_WEIGHT'
    });
  }

  if (!isValidWeight(input.startWeight)) {
    errors.push({
      field: 'startWeight',
      message: `Start weight must be between ${VALIDATION_CONSTANTS.WEIGHT.MIN} and ${VALIDATION_CONSTANTS.WEIGHT.MAX} kg`,
      code: 'INVALID_START_WEIGHT'
    });
  }

  // Validate goal type
  if (!isValidGoalType(input.goalType)) {
    errors.push({
      field: 'goalType',
      message: 'Goal type must be either "gain" or "lose"',
      code: 'INVALID_GOAL_TYPE'
    });
  }

  // Validate goal consistency
  if (isValidWeight(input.targetWeight) && isValidWeight(input.startWeight) && isValidGoalType(input.goalType)) {
    if (!isGoalConsistent(input.goalType, input.startWeight, input.targetWeight)) {
      errors.push({
        field: 'targetWeight',
        message: input.goalType === 'lose' 
          ? 'For weight loss goals, target weight must be less than start weight'
          : 'For weight gain goals, target weight must be greater than start weight',
        code: 'GOAL_WEIGHT_INCONSISTENT'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate weight log creation input
 */
export function validateCreateWeightLog(input: CreateWeightLogInput): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = [];

  // Validate challenge ID
  if (!isValidString(input.challengeId, VALIDATION_CONSTANTS.STRING_LENGTHS.USER_ID.MAX)) {
    errors.push({
      field: 'challengeId',
      message: 'Challenge ID must be a non-empty string',
      code: 'INVALID_CHALLENGE_ID'
    });
  }

  // Validate weight
  if (!isValidWeight(input.weight)) {
    errors.push({
      field: 'weight',
      message: `Weight must be between ${VALIDATION_CONSTANTS.WEIGHT.MIN} and ${VALIDATION_CONSTANTS.WEIGHT.MAX} kg`,
      code: 'INVALID_WEIGHT'
    });
  }

  // Validate unit (if provided)
  if (input.unit && !['kg', 'lbs'].includes(input.unit)) {
    errors.push({
      field: 'unit',
      message: 'Unit must be either "kg" or "lbs"',
      code: 'INVALID_UNIT'
    });
  }

  // Validate logged date
  const loggedAt = new Date(input.loggedAt);
  if (isNaN(loggedAt.getTime())) {
    errors.push({
      field: 'loggedAt',
      message: 'Logged date must be a valid date',
      code: 'INVALID_LOGGED_DATE'
    });
  }

  // Check if date is not too far in the future (allow up to 1 day)
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  if (loggedAt > oneDayFromNow) {
    errors.push({
      field: 'loggedAt',
      message: 'Logged date cannot be more than 1 day in the future',
      code: 'FUTURE_DATE_TOO_FAR'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate challenge update input
 */
export function validateUpdateChallenge(input: UpdateChallengeInput): ValidationResult {
  const errors: Array<{ field: string; message: string; code?: string }> = [];

  // Validate name (if provided)
  if (input.name !== undefined && !isValidString(input.name, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MAX, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MIN)) {
    errors.push({
      field: 'name',
      message: `Challenge name must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MIN} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_NAME.MAX} characters`,
      code: 'INVALID_NAME_LENGTH'
    });
  }

  // Validate description (if provided)
  if (input.description !== undefined && !isValidString(input.description, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MAX, VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MIN)) {
    errors.push({
      field: 'description',
      message: `Challenge description must be between ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MIN} and ${VALIDATION_CONSTANTS.STRING_LENGTHS.CHALLENGE_DESCRIPTION.MAX} characters`,
      code: 'INVALID_DESCRIPTION_LENGTH'
    });
  }

  // Validate participant limit (if provided)
  if (input.participantLimit !== undefined && !isValidParticipantLimit(input.participantLimit)) {
    errors.push({
      field: 'participantLimit',
      message: `Participant limit must be a positive integer not exceeding ${VALIDATION_CONSTANTS.PARTICIPANT_LIMIT.MAX}`,
      code: 'INVALID_PARTICIPANT_LIMIT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input by trimming whitespace
 */
export function sanitizeString(input: string): string {
  return typeof input === 'string' ? input.trim() : '';
}

/**
 * Convert weight from pounds to kilograms
 */
export function convertLbsToKg(weightInLbs: number): number {
  return weightInLbs * 0.453592;
}

/**
 * Convert weight from kilograms to pounds
 */
export function convertKgToLbs(weightInKg: number): number {
  return weightInKg * 2.20462;
}

/**
 * Normalize weight to kilograms
 */
export function normalizeWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): number {
  return unit === 'lbs' ? convertLbsToKg(weight) : weight;
}

/**
 * Create a standardized API error response
 */
export function createValidationErrorResponse(errors: ValidationResult['errors']) {
  return {
    success: false,
    error: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized API success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
} 