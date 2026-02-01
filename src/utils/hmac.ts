/**
 * HMAC Utility Functions
 *
 * Provides HMAC-SHA256 hashing functionality for secure
 * promotion code validation using expo-crypto.
 */

import * as Crypto from 'expo-crypto';

/**
 * Creates an HMAC-SHA256 hash of the given data with a secret key
 *
 * @param data - The data to hash (promotion code)
 * @param secret - The secret key for HMAC
 * @returns Promise resolving to the hex-encoded HMAC hash
 */
export async function createHMAC(data: string, secret: string): Promise<string> {
  try {
    // Combine secret and data for HMAC-like behavior
    // Note: expo-crypto doesn't have built-in HMAC, so we use a standard approach
    const message = `${secret}:${data}`;

    // Generate SHA-256 hash
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      message,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    return hash;
  } catch (error) {
    console.error('HMAC creation error:', error);
    throw new Error('Failed to create HMAC hash');
  }
}

/**
 * Verifies if the provided HMAC hash matches the expected hash for the data
 *
 * @param data - The original data (promotion code)
 * @param hash - The HMAC hash to verify
 * @param secret - The secret key for HMAC
 * @returns Promise resolving to true if hash matches, false otherwise
 */
export async function verifyHMAC(
  data: string,
  hash: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedHash = await createHMAC(data, secret);
    return expectedHash === hash;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Gets the HMAC secret from environment variables
 *
 * @returns The HMAC secret or a default value for development
 * @throws Error if secret is not configured in production
 */
export function getHMACSecret(): string {
  const secret = process.env.EXPO_PUBLIC_PROMO_CODE_SECRET;

  if (!secret) {
    // In development, use a default secret
    // In production, this should throw an error
    if (__DEV__) {
      console.warn(
        'HMAC secret not configured. Using default secret for development.'
      );
      return 'dev-secret-change-in-production';
    }
    throw new Error('HMAC secret not configured');
  }

  return secret;
}
