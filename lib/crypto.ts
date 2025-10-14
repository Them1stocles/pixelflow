import crypto from 'crypto';
import CryptoJS from 'crypto-js';

/**
 * Hash a string using SHA-256
 * Used for hashing emails, phone numbers for privacy compliance
 */
export function hashSHA256(input: string): string {
  if (!input) return '';

  // Normalize the input (lowercase, trim whitespace)
  const normalized = input.toLowerCase().trim();

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Hash an email address for Facebook/TikTok Conversions API
 */
export function hashEmail(email: string): string {
  if (!email) return '';
  return hashSHA256(email);
}

/**
 * Hash a phone number for Facebook/TikTok Conversions API
 * Removes all non-numeric characters before hashing
 */
export function hashPhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters
  const normalized = phone.replace(/\D/g, '');

  return hashSHA256(normalized);
}

/**
 * Generate a deterministic event ID for deduplication
 * This ensures the same event data always generates the same ID
 */
export function generateEventId(params: {
  merchantId: string;
  eventName: string;
  userId?: string;
  orderId?: string;
  timestamp: number;
  value?: number;
  contentIds?: string[];
}): string {
  const { merchantId, eventName, userId, orderId, timestamp, value, contentIds } = params;

  // Round timestamp to 5-second window for deduplication
  const roundedTimestamp = Math.floor(timestamp / 5000) * 5000;

  // Create a deterministic string from the event data
  const dataString = [
    merchantId,
    eventName,
    userId || '',
    orderId || '',
    roundedTimestamp,
    value || '',
    (contentIds || []).sort().join(','),
  ].join('|');

  return hashSHA256(dataString);
}

/**
 * Encrypt sensitive data (access tokens, API keys)
 * Note: In production, use a proper encryption key management system
 */
export function encrypt(text: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Verify webhook signature (HMAC SHA-256)
 * Used for Whop webhooks
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`;

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
