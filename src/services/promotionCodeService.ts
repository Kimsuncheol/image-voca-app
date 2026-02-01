/**
 * Promotion Code Service
 *
 * Core business logic for promotion code generation, validation,
 * and redemption. Handles HMAC validation, usage limits, and
 * benefit application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { createHMAC, getHMACSecret, verifyHMAC } from '../utils/hmac';
import type {
  CodeGenerationRequest,
  CodeGenerationResponse,
  PromotionBenefit,
  PromotionCode,
  RateLimitData,
  RedemptionResult,
  ValidationResult,
} from '../types/promotionCode';

// Constants
const RATE_LIMIT_KEY_PREFIX = '@promo_rate_limit_';
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CODE_LENGTH = 8;
const AMBIGUOUS_CHARS = /[0OIl1]/g;

/**
 * Generates a secure random promotion code
 *
 * @returns Promise resolving to an 8-character alphanumeric code
 */
export async function generatePromotionCode(): Promise<string> {
  try {
    // Generate random bytes
    const randomBytes = await Crypto.getRandomBytesAsync(6);

    // Convert to base64 and clean up
    const base64 = btoa(String.fromCharCode(...randomBytes));

    // Remove non-alphanumeric characters and ambiguous chars
    let code = base64
      .replace(/[^A-Z0-9]/gi, '')
      .replace(AMBIGUOUS_CHARS, '')
      .toUpperCase()
      .slice(0, CODE_LENGTH);

    // If we don't have enough characters, generate more
    while (code.length < CODE_LENGTH) {
      const moreBytes = await Crypto.getRandomBytesAsync(2);
      const moreChars = btoa(String.fromCharCode(...moreBytes))
        .replace(/[^A-Z0-9]/gi, '')
        .replace(AMBIGUOUS_CHARS, '')
        .toUpperCase();
      code += moreChars;
    }

    return code.slice(0, CODE_LENGTH);
  } catch (error) {
    console.error('Code generation error:', error);
    throw new Error('Failed to generate promotion code');
  }
}

/**
 * Validates the format of a promotion code
 *
 * @param code - The code to validate
 * @returns True if format is valid
 */
export function validateCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Must be 8 characters, alphanumeric, no ambiguous characters
  const format = /^[A-Z2-9]{8}$/;
  return format.test(code.toUpperCase());
}

/**
 * Checks and updates rate limiting for code validation attempts
 *
 * @param userId - The user ID attempting validation
 * @returns Promise resolving to true if allowed, false if rate limited
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const key = `${RATE_LIMIT_KEY_PREFIX}${userId}`;
    const dataStr = await AsyncStorage.getItem(key);

    const now = Date.now();
    let data: RateLimitData = dataStr
      ? JSON.parse(dataStr)
      : { attempts: 0, lastAttempt: now };

    // Check if currently blocked
    if (data.blockedUntil && data.blockedUntil > now) {
      return false;
    }

    // Reset if outside rate limit window
    if (now - data.lastAttempt > RATE_LIMIT_WINDOW_MS) {
      data = { attempts: 0, lastAttempt: now };
    }

    // Increment attempts
    data.attempts += 1;
    data.lastAttempt = now;

    // Block if exceeded max attempts
    if (data.attempts > MAX_ATTEMPTS) {
      data.blockedUntil = now + RATE_LIMIT_WINDOW_MS;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return false;
    }

    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to avoid blocking legitimate users
    return true;
  }
}

/**
 * Validates a promotion code
 *
 * @param code - The promotion code to validate
 * @param userId - The user ID attempting to redeem
 * @returns Promise resolving to validation result
 */
export async function validateCode(
  code: string,
  userId: string
): Promise<ValidationResult> {
  try {
    // Check rate limiting
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      return {
        valid: false,
        error: 'Too many attempts. Please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
      };
    }

    // Validate format
    if (!validateCodeFormat(code)) {
      return {
        valid: false,
        error: 'Invalid code format',
        errorCode: 'INVALID_FORMAT',
      };
    }

    const normalizedCode = code.toUpperCase();

    // Query Firestore for the code
    const codesQuery = query(
      collection(db, 'promotionCodes'),
      where('code', '==', normalizedCode),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(codesQuery);

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'Invalid code',
        errorCode: 'CODE_NOT_FOUND',
      };
    }

    const codeDoc = snapshot.docs[0];
    const promotionCode = codeDoc.data() as PromotionCode;

    // Verify HMAC
    const secret = getHMACSecret();
    const isValidHash = await verifyHMAC(
      normalizedCode,
      promotionCode.codeHash,
      secret
    );

    if (!isValidHash) {
      return {
        valid: false,
        error: 'Invalid code',
        errorCode: 'INVALID_HASH',
      };
    }

    // Check event period
    const now = new Date();
    const startDate = new Date(promotionCode.eventPeriod.startDate);
    const endDate = new Date(promotionCode.eventPeriod.endDate);

    if (now < startDate) {
      return {
        valid: false,
        error: `This code is not active yet. It will be active from ${startDate.toLocaleDateString()}.`,
        errorCode: 'CODE_NOT_ACTIVE_YET',
      };
    }

    if (now > endDate) {
      return {
        valid: false,
        error: 'This code has expired',
        errorCode: 'CODE_EXPIRED',
      };
    }

    // Check usage limits
    if (
      promotionCode.maxUses !== -1 &&
      promotionCode.currentUses >= promotionCode.maxUses
    ) {
      return {
        valid: false,
        error: 'This code has reached its usage limit',
        errorCode: 'USAGE_LIMIT_REACHED',
      };
    }

    // Check if user already redeemed
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const redeemedCodes = userData.redeemedCodes || [];

      const alreadyRedeemed = redeemedCodes.some(
        (r: any) => r.code === normalizedCode
      );

      if (alreadyRedeemed) {
        // Check maxUsesPerUser
        const redemptionCount = redeemedCodes.filter(
          (r: any) => r.code === normalizedCode
        ).length;

        if (redemptionCount >= promotionCode.maxUsesPerUser) {
          return {
            valid: false,
            error: "You've already redeemed this code",
            errorCode: 'ALREADY_REDEEMED',
          };
        }
      }
    }

    return {
      valid: true,
      promotionCode,
    };
  } catch (error) {
    console.error('Code validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate code. Please try again.',
    };
  }
}

/**
 * Applies a promotion benefit to a user
 *
 * @param userId - The user ID
 * @param benefit - The benefit to apply
 * @returns Promise resolving when benefit is applied
 */
async function applyBenefit(
  userId: string,
  benefit: PromotionBenefit
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  if (benefit.type === 'subscription_upgrade') {
    const subscriptionData: any = {
      planId: benefit.planId,
      updatedAt: new Date().toISOString(),
    };

    // For temporary subscriptions, add expiry
    if (!benefit.isPermanent && benefit.durationDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + benefit.durationDays);
      subscriptionData.expiresAt = expiryDate.toISOString();
    }

    await updateDoc(userRef, {
      subscription: subscriptionData,
    });
  }
}

/**
 * Redeems a promotion code for a user
 *
 * @param userId - The user ID
 * @param code - The promotion code to redeem
 * @returns Promise resolving to redemption result
 */
export async function redeemCode(
  userId: string,
  code: string
): Promise<RedemptionResult> {
  try {
    // Validate code first
    const validation = await validateCode(code, userId);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid code',
        error: validation.error,
        errorCode: validation.errorCode,
      };
    }

    const promotionCode = validation.promotionCode!;
    const normalizedCode = code.toUpperCase();

    // Use transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const codeRef = doc(db, 'promotionCodes', normalizedCode);

      // Re-check usage limits in transaction
      const codeSnap = await transaction.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error('Code not found');
      }

      const currentCodeData = codeSnap.data() as PromotionCode;

      if (
        currentCodeData.maxUses !== -1 &&
        currentCodeData.currentUses >= currentCodeData.maxUses
      ) {
        throw new Error('Usage limit reached');
      }

      // Increment usage count
      transaction.update(codeRef, {
        currentUses: currentCodeData.currentUses + 1,
      });

      // Apply benefit
      const subscriptionData: any = {
        planId: promotionCode.benefit.planId,
        updatedAt: new Date().toISOString(),
        promotionCode: normalizedCode,
      };

      if (
        !promotionCode.benefit.isPermanent &&
        promotionCode.benefit.durationDays
      ) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + promotionCode.benefit.durationDays);
        subscriptionData.expiresAt = expiryDate.toISOString();
      }

      // Add to redeemed codes
      const redemptionRecord = {
        code: normalizedCode,
        redeemedAt: new Date().toISOString(),
        benefitReceived: `${promotionCode.benefit.planId} subscription${
          !promotionCode.benefit.isPermanent
            ? ` for ${promotionCode.benefit.durationDays} days`
            : ''
        }`,
      };

      transaction.update(userRef, {
        subscription: subscriptionData,
        redeemedCodes: [...(currentCodeData as any).redeemedCodes || [], redemptionRecord],
      });

      return promotionCode.benefit;
    });

    return {
      success: true,
      message: 'Promotion code redeemed successfully!',
      benefit: result,
    };
  } catch (error: any) {
    console.error('Code redemption error:', error);
    return {
      success: false,
      message: 'Failed to redeem code. Please try again.',
      error: error.message,
    };
  }
}

/**
 * Generates multiple promotion codes (admin function)
 *
 * @param request - Code generation request parameters
 * @param adminUserId - The admin user ID creating the codes
 * @returns Promise resolving to generated codes
 */
export async function generatePromotionCodes(
  request: CodeGenerationRequest,
  adminUserId: string
): Promise<CodeGenerationResponse> {
  try {
    const codes: string[] = [];
    const codeIds: string[] = [];
    const secret = getHMACSecret();

    for (let i = 0; i < request.count; i++) {
      const code = await generatePromotionCode();
      const codeHash = await createHMAC(code, secret);

      const promotionCode: PromotionCode = {
        code,
        codeHash,
        eventPeriod: request.eventPeriod,
        benefit: request.benefit,
        maxUses: request.maxUses,
        maxUsesPerUser: request.maxUsesPerUser,
        currentUses: 0,
        createdAt: new Date().toISOString(),
        createdBy: adminUserId,
        status: 'active',
        description: request.description,
      };

      const codeRef = doc(db, 'promotionCodes', code);
      await setDoc(codeRef, promotionCode);

      codes.push(code);
      codeIds.push(code);
    }

    return { codes, codeIds };
  } catch (error) {
    console.error('Code generation error:', error);
    throw new Error('Failed to generate promotion codes');
  }
}

/**
 * Gets all promotion codes (admin function)
 *
 * @returns Promise resolving to all promotion codes
 */
export async function getAllPromotionCodes(): Promise<PromotionCode[]> {
  try {
    const snapshot = await getDocs(collection(db, 'promotionCodes'));
    return snapshot.docs.map((doc) => doc.data() as PromotionCode);
  } catch (error) {
    console.error('Get codes error:', error);
    throw new Error('Failed to fetch promotion codes');
  }
}

/**
 * Deactivates a promotion code (admin function)
 *
 * @param code - The code to deactivate
 * @returns Promise resolving when code is deactivated
 */
export async function deactivateCode(code: string): Promise<void> {
  try {
    const codeRef = doc(db, 'promotionCodes', code.toUpperCase());
    await updateDoc(codeRef, {
      status: 'inactive',
    });
  } catch (error) {
    console.error('Deactivate code error:', error);
    throw new Error('Failed to deactivate code');
  }
}
