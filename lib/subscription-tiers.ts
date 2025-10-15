/**
 * Subscription Tier Configuration
 * Centralized configuration for all subscription tiers and limits
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TierConfig {
  name: string;
  displayName: string;
  eventLimit: number; // -1 = unlimited
  price: number; // in dollars
  features: string[];
  recommended?: boolean;
}

/**
 * Tier configurations
 * Single source of truth for all tier limits and features
 */
export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    eventLimit: 20,
    price: 0,
    features: [
      '20 events per month',
      'Basic pixel tracking',
      'Facebook & TikTok pixels',
      'Email support',
    ],
  },
  basic: {
    name: 'basic',
    displayName: 'Basic',
    eventLimit: 300,
    price: 29,
    features: [
      '300 events per month',
      'Advanced pixel tracking',
      'All platform pixels',
      'Priority email support',
      'Event history (30 days)',
    ],
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    eventLimit: 1500,
    price: 79,
    recommended: true,
    features: [
      '1,500 events per month',
      'Server-side tracking',
      'All platform pixels',
      'Priority support',
      'Event history (90 days)',
      'Custom event parameters',
      'Detailed analytics',
    ],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    eventLimit: -1, // unlimited
    price: 199,
    features: [
      'Unlimited events',
      'Server-side tracking',
      'All platform pixels',
      'Dedicated support',
      'Unlimited event history',
      'Custom integrations',
      'Advanced analytics',
      'White-label options',
    ],
  },
};

/**
 * Get tier configuration by name
 */
export function getTierConfig(tier: string): TierConfig {
  const normalizedTier = tier.toLowerCase() as SubscriptionTier;
  return TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.free;
}

/**
 * Check if merchant is at or over their limit
 */
export function isOverLimit(currentCount: number, limit: number): boolean {
  // Unlimited tier (-1) never hits limit
  if (limit === -1) return false;
  return currentCount >= limit;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(currentCount: number, limit: number): number {
  // Unlimited tier
  if (limit === -1) return 0;

  const percentage = (currentCount / limit) * 100;
  return Math.min(percentage, 100);
}

/**
 * Get warning level based on usage
 */
export type WarningLevel = 'safe' | 'warning' | 'danger' | 'exceeded';

export function getWarningLevel(currentCount: number, limit: number): WarningLevel {
  // Unlimited tier
  if (limit === -1) return 'safe';

  const percentage = getUsagePercentage(currentCount, limit);

  if (currentCount >= limit) return 'exceeded';
  if (percentage >= 90) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
}

/**
 * Get next tier recommendation
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null; // Already at highest tier
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Get Whop checkout URL for a specific tier
 * Note: Replace with actual Whop product IDs once configured
 */
export function getUpgradeUrl(tier: SubscriptionTier): string {
  // TODO: Replace with actual Whop product IDs from dashboard
  const productIds: Record<SubscriptionTier, string> = {
    free: '', // No upgrade URL for free
    basic: 'WHOP_BASIC_PRODUCT_ID',
    pro: 'WHOP_PRO_PRODUCT_ID',
    enterprise: 'WHOP_ENTERPRISE_PRODUCT_ID',
  };

  const productId = productIds[tier];
  if (!productId) return '/dashboard';

  return `https://whop.com/checkout/${productId}`;
}

/**
 * Format event count with commas
 */
export function formatEventCount(count: number): string {
  if (count === -1) return 'Unlimited';
  return count.toLocaleString();
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    free: 'gray',
    basic: 'blue',
    pro: 'purple',
    enterprise: 'gradient',
  };
  return colors[tier] || 'gray';
}
