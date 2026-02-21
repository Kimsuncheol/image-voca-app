/**
 * Promotion Code Types and Interfaces
 *
 * Type definitions for the promotion code system including
 * database schema, validation results, and UI state.
 */

/**
 * Subscription plan types that can be granted via promotion codes
 */
export type PlanType = "voca_unlimited" | "voca_speaking";

/**
 * Promotion code status
 */
export type PromotionCodeStatus = "active" | "inactive" | "expired";

/**
 * Benefit type for promotion codes
 */
export interface PromotionBenefit {
  type: "subscription_upgrade";
  planId: PlanType;
  isPermanent: boolean;
  durationDays?: number; // Required if isPermanent = false
}

/**
 * Event period for promotion code validity
 */
export interface EventPeriod {
  startDate: string; // ISO timestamp
  endDate: string;   // ISO timestamp
}

/**
 * Main promotion code document structure (Firestore)
 */
export interface PromotionCode {
  code: string;
  codeHash: string;
  eventPeriod: EventPeriod;
  benefit: PromotionBenefit;
  maxUses: number;       // -1 for unlimited
  maxUsesPerUser: number;
  currentUses: number;
  createdAt: string;
  createdBy: string;
  status: PromotionCodeStatus;
  description: string;
}

/**
 * Redeemed code entry in user document
 */
export interface RedeemedCode {
  code: string;
  redeemedAt: string;
  benefitReceived: string;
}

/**
 * Validation result from code validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: ValidationErrorCode;
  promotionCode?: PromotionCode;
}

/**
 * Error codes for validation failures
 */
export type ValidationErrorCode =
  | "CODE_NOT_FOUND"
  | "INVALID_HASH"
  | "CODE_EXPIRED"
  | "CODE_NOT_ACTIVE_YET"
  | "USAGE_LIMIT_REACHED"
  | "ALREADY_REDEEMED"
  | "INVALID_FORMAT"
  | "RATE_LIMIT_EXCEEDED";

/**
 * Redemption result
 */
export interface RedemptionResult {
  success: boolean;
  message: string;
  benefit?: PromotionBenefit;
  error?: string;
  errorCode?: ValidationErrorCode;
}

/**
 * Rate limiting data stored in AsyncStorage
 */
export interface RateLimitData {
  attempts: number;
  lastAttempt: number; // timestamp
  blockedUntil?: number; // timestamp
}

/**
 * Promotion code generation request
 */
export interface CodeGenerationRequest {
  eventPeriod: EventPeriod;
  benefit: PromotionBenefit;
  maxUses: number;
  maxUsesPerUser: number;
  description: string;
  count: number; // Number of codes to generate
}

/**
 * Code generation response
 */
export interface CodeGenerationResponse {
  codes: string[];
  codeIds: string[];
}
