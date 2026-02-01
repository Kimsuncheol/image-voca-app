/**
 * Promotion Code Store
 *
 * Zustand store for managing promotion code UI state including
 * input validation, redemption status, and error handling.
 */

import { create } from 'zustand';
import type { PromotionBenefit } from '../types/promotionCode';
import { redeemCode, validateCodeFormat } from '../services/promotionCodeService';

interface PromotionCodeState {
  // Input state
  codeInput: string;

  // Validation state
  validating: boolean;
  validationError: string | null;

  // Redemption state
  redeeming: boolean;
  redemptionSuccess: boolean;
  redemptionMessage: string | null;
  redeemedBenefit: PromotionBenefit | null;

  // Actions
  setCodeInput: (code: string) => void;
  validateAndRedeemCode: (userId: string) => Promise<boolean>;
  resetState: () => void;
  clearError: () => void;
}

export const usePromotionCodeStore = create<PromotionCodeState>((set, get) => ({
  // Initial state
  codeInput: '',
  validating: false,
  validationError: null,
  redeeming: false,
  redemptionSuccess: false,
  redemptionMessage: null,
  redeemedBenefit: null,

  // Set code input with format validation
  setCodeInput: (code: string) => {
    // Auto-uppercase and trim
    const normalizedCode = code.toUpperCase().trim();

    set({
      codeInput: normalizedCode,
      validationError: null,
      redemptionMessage: null,
    });

    // Validate format if code is complete
    if (normalizedCode.length === 8) {
      if (!validateCodeFormat(normalizedCode)) {
        set({
          validationError: 'Invalid code format. Code must be 8 alphanumeric characters.',
        });
      }
    }
  },

  // Validate and redeem code
  validateAndRedeemCode: async (userId: string): Promise<boolean> => {
    const { codeInput } = get();

    // Quick format check
    if (!validateCodeFormat(codeInput)) {
      set({
        validationError: 'Invalid code format',
      });
      return false;
    }

    set({
      redeeming: true,
      validationError: null,
      redemptionMessage: null,
      redemptionSuccess: false,
    });

    try {
      const result = await redeemCode(userId, codeInput);

      if (result.success) {
        set({
          redeeming: false,
          redemptionSuccess: true,
          redemptionMessage: result.message,
          redeemedBenefit: result.benefit || null,
          codeInput: '', // Clear input on success
        });
        return true;
      } else {
        set({
          redeeming: false,
          redemptionSuccess: false,
          validationError: result.error || 'Failed to redeem code',
        });
        return false;
      }
    } catch (error: any) {
      set({
        redeeming: false,
        redemptionSuccess: false,
        validationError: error.message || 'An error occurred. Please try again.',
      });
      return false;
    }
  },

  // Reset all state
  resetState: () => {
    set({
      codeInput: '',
      validating: false,
      validationError: null,
      redeeming: false,
      redemptionSuccess: false,
      redemptionMessage: null,
      redeemedBenefit: null,
    });
  },

  // Clear error messages
  clearError: () => {
    set({
      validationError: null,
      redemptionMessage: null,
    });
  },
}));
