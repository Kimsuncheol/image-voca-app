/**
 * Admin Code Types
 *
 * TypeScript interfaces for admin code generation and validation.
 */

export interface AdminCode {
  code: string; // The admin code (e.g., "ADMIN-ABC-123")
  createdAt: string; // ISO timestamp
  createdBy: string; // Admin user ID who created it
  expiresAt?: string; // Optional expiration date
  maxUses: number; // Maximum number of times this code can be used (-1 for unlimited)
  currentUses: number; // Current number of times this code has been used
  isActive: boolean; // Whether the code is currently active
  description?: string; // Optional description/notes
}

export interface AdminCodeValidationResult {
  isValid: boolean;
  errorMessage?: string;
  code?: AdminCode;
}

export interface AdminCodeGenerationOptions {
  expiresInDays?: number; // Optional expiration in days
  maxUses?: number; // Maximum uses (default: 1)
  description?: string; // Optional description
}
