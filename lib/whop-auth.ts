import { validateToken, hasAccess } from '@whop-apps/sdk';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from './prisma';

/**
 * Whop Authentication Utilities
 * Uses Whop SDK for production-ready OAuth authentication
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
    const headersList = headers();

    console.log('[PixelFlow Auth] 🔍 Validating Whop token...');

    // Pass headers directly to validateToken - SDK handles cookie extraction
    const tokenData = await validateToken({
      headers,
      dontThrow: true,
    });

    if (!tokenData) {
      console.warn('[PixelFlow Auth] ⚠️  validateToken returned null - no token found in request headers');
      console.warn('[PixelFlow Auth] ℹ️  This is expected before Whop app approval or when not using whop-proxy in development');
      return null;
    }

    if (!tokenData.userId) {
      console.warn('[PixelFlow Auth] ⚠️  Token validated but userId missing:', tokenData);
      return null;
    }

    console.log('[PixelFlow Auth] ✅ Token validated successfully');
    console.log('[PixelFlow Auth] User ID:', tokenData.userId);
    console.log('[PixelFlow Auth] App ID:', tokenData.appId);

    return {
      userId: tokenData.userId,
      companyId: null,
      experienceId: null,
    };
  } catch (error) {
    console.error('[PixelFlow Auth] ❌ Error validating Whop session:', error);
    if (error instanceof Error) {
      console.error('[PixelFlow Auth] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
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
export async function checkWhopAccess(productId: string): Promise<boolean> {
  try {
    // Pass headers directly to hasAccess - SDK handles cookie extraction
    const hasProductAccess = await hasAccess({
      to: productId, // Simple expression - just check if user has access to this product
      headers,
    });

    return hasProductAccess;
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
    // For API routes, we need to create a headers-like object from the request
    // The validateToken SDK function expects a headers object, not a Request object
    const requestHeaders = {
      get: (key: string) => request.headers.get(key),
    };

    // Validate token using SDK - pass headers object
    const tokenData = await validateToken({
      headers: requestHeaders as any,
      dontThrow: true,
    });

    if (!tokenData || !tokenData.userId) {
      return null;
    }

    // Find or create merchant
    let merchant = await prisma.merchant.findUnique({
      where: { whopUserId: tokenData.userId },
    });

    if (!merchant) {
      // Use upsert to avoid duplicate key errors
      merchant = await prisma.merchant.upsert({
        where: { whopUserId: tokenData.userId },
        update: {},
        create: {
          whopUserId: tokenData.userId,
          whopCompanyId: null,
          email: `${tokenData.userId}@whop.user`,
          subscriptionTier: 'free',
          monthlyEventLimit: 20, // Free tier: 20 events/month
          monthlyEventCount: 0,
        },
      });
    }

    return merchant;
  } catch (error) {
    console.error('Error getting merchant from request:', error);
    return null;
  }
}
