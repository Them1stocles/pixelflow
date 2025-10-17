import { whopSdk } from './whop-sdk';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';

/**
 * Whop Authentication Utilities
 * Uses modern @whop/api SDK for production-ready OAuth authentication
 * Following official whop-nextjs-app-template pattern
 */

export interface WhopUser {
  id: string;
  email: string;
  username: string | null;
  profilePicUrl: string | null;
}

export interface WhopSession {
  userId: string;
  companyId: string | null;
  experienceId: string | null;
}

/**
 * Get the current Whop user session
 * Validates the whop_user_token cookie from headers
 * Returns null if invalid or not authenticated
 */
export async function getWhopSession(): Promise<WhopSession | null> {
  try {
    console.log('[PixelFlow Auth] 🔍 Validating Whop token...');

    // Get headers list
    const headersList = await headers();

    // ✅ Use the new @whop/api SDK pattern
    // Pass headersList object directly (not wrapped in { headers })
    const { userId } = await whopSdk.verifyUserToken(headersList);

    if (!userId) {
      console.warn('[PixelFlow Auth] ⚠️  Token validated but no userId found');
      return null;
    }

    console.log('[PixelFlow Auth] ✅ Token validated successfully');
    console.log('[PixelFlow Auth] User ID:', userId);

    return {
      userId,
      companyId: null,
      experienceId: null,
    };
  } catch (error) {
    // Expected error when not authenticated or running outside Whop iframe
    console.log('[PixelFlow Auth] ℹ️  No valid Whop authentication found');
    console.log('[PixelFlow Auth] ℹ️  This is expected before app approval or in local development without whop-proxy');

    // Log actual error for debugging
    if (error instanceof Error) {
      console.log('[PixelFlow Auth] Debug - Error:', error.message);
    }

    return null;
  }
}

/**
 * Get the current authenticated merchant
 * Creates merchant in database if they don't exist
 * Returns null if not authenticated
 */
export async function getWhopMerchant(session?: WhopSession | null) {
  const whopSession = session || (await getWhopSession());

  if (!whopSession) {
    console.log('[PixelFlow Auth] No Whop session available, cannot get merchant');
    return null;
  }

  console.log('[PixelFlow Auth] 🔍 Looking up merchant for user:', whopSession.userId);

  // Find or create merchant based on Whop user ID
  let merchant = await prisma.merchant.findUnique({
    where: { whopUserId: whopSession.userId },
  });

  if (!merchant) {
    console.log('[PixelFlow Auth] 🆕 Merchant not found, creating new merchant record');

    // Create or update merchant for Whop user
    // Use upsert to handle cases where merchant might exist but query failed
    merchant = await prisma.merchant.upsert({
      where: { whopUserId: whopSession.userId },
      update: {
        // Update company ID if it changed
        whopCompanyId: whopSession.companyId,
      },
      create: {
        whopUserId: whopSession.userId,
        whopCompanyId: whopSession.companyId,
        email: `${whopSession.userId}@whop.user`, // Placeholder until we get real email
        name: null,
        subscriptionTier: 'free',
        monthlyEventLimit: 20, // Free tier: 20 events/month
        monthlyEventCount: 0,
      },
    });

    console.log('[PixelFlow Auth] ✅ Created/updated merchant:', {
      id: merchant.id,
      whopUserId: merchant.whopUserId,
      tier: merchant.subscriptionTier,
      eventLimit: merchant.monthlyEventLimit,
    });
  } else {
    console.log('[PixelFlow Auth] ✅ Found existing merchant:', {
      id: merchant.id,
      tier: merchant.subscriptionTier,
      events: `${merchant.monthlyEventCount}/${merchant.monthlyEventLimit}`,
    });
  }

  return merchant;
}

/**
 * Require authentication - redirects to Whop login if not authenticated
 * Use this in Server Components that require authentication
 */
export async function requireWhopAuth() {
  const session = await getWhopSession();

  if (!session) {
    // Redirect to Whop login
    // In Whop apps, this typically redirects to the Whop platform
    redirect('https://whop.com/login');
  }

  const merchant = await getWhopMerchant(session);

  if (!merchant) {
    throw new Error('Failed to load merchant data');
  }

  return merchant;
}

/**
 * Check if user has access to a specific experience/product
 * Use this for premium features or content gating
 */
export async function checkWhopAccess(experienceId: string): Promise<boolean> {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);

    if (!userId) {
      return false;
    }

    // ✅ Use the SDK's built-in access check
    const result = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    return result.hasAccess;
  } catch (error) {
    console.error('Error checking Whop access:', error);
    return false;
  }
}

/**
 * Get merchant from request (for API routes)
 * Use this in API Route handlers
 */
export async function getMerchantFromRequest(request: Request) {
  try {
    // ✅ Create headers-like object from Request
    const requestHeaders = {
      get: (key: string) => request.headers.get(key),
      forEach: (callback: (value: string, key: string) => void) => {
        request.headers.forEach(callback);
      },
    };

    // ✅ Verify token with new SDK
    const { userId } = await whopSdk.verifyUserToken(requestHeaders as any);

    if (!userId) {
      return null;
    }

    // Find or create merchant
    let merchant = await prisma.merchant.findUnique({
      where: { whopUserId: userId },
    });

    if (!merchant) {
      // Use upsert to avoid duplicate key errors
      merchant = await prisma.merchant.upsert({
        where: { whopUserId: userId },
        update: {},
        create: {
          whopUserId: userId,
          whopCompanyId: null,
          email: `${userId}@whop.user`,
          subscriptionTier: 'free',
          monthlyEventLimit: 20, // Free tier: 20 events/month
          monthlyEventCount: 0,
        },
      });
    }

    return merchant;
  } catch (error) {
    console.log('[PixelFlow Auth] No valid authentication in API request');
    if (error instanceof Error) {
      console.log('[PixelFlow Auth] Debug - API auth error:', error.message);
    }
    return null;
  }
}
