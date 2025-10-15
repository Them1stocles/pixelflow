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

    // Extract token from cookie header
    const cookieHeader = headersList.get('cookie');
    const whopToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('whop_user_token='))
      ?.split('=')[1];

    if (!whopToken) {
      console.log('No whop_user_token found in cookies');
      return null;
    }

    // Validate token with Whop SDK
    const tokenData = await validateToken({
      token: whopToken,
      dontThrow: true,
    });

    if (!tokenData || !tokenData.userId) {
      console.log('Invalid Whop token');
      return null;
    }

    return {
      userId: tokenData.userId,
      companyId: null, // Whop SDK doesn't expose this in token validation
      experienceId: null, // Would need to come from URL params
    };
  } catch (error) {
    console.error('Error validating Whop session:', error);
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
    return null;
  }

  // Find or create merchant based on Whop user ID
  let merchant = await prisma.merchant.findUnique({
    where: { whopUserId: whopSession.userId },
  });

  if (!merchant) {
    // Create new merchant for first-time Whop user
    // We'll get their email from Whop API or set a placeholder
    merchant = await prisma.merchant.create({
      data: {
        whopUserId: whopSession.userId,
        whopCompanyId: whopSession.companyId,
        email: `${whopSession.userId}@whop.user`, // Placeholder until we get real email
        name: null,
        subscriptionTier: 'free',
        monthlyEventLimit: 20, // Free tier: 20 events/month
        monthlyEventCount: 0,
      },
    });

    console.log(`Created new merchant for Whop user ${whopSession.userId}`);
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
    const headersList = headers();
    const cookieHeader = headersList.get('cookie');
    const whopToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('whop_user_token='))
      ?.split('=')[1];

    if (!whopToken) {
      return false;
    }

    // Use hasAccess with the product ID as the expression
    const hasProductAccess = await hasAccess({
      to: productId, // Simple expression - just check if user has access to this product
      token: whopToken,
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
    // Extract token from cookie header
    const cookieHeader = request.headers.get('cookie');
    const whopToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('whop_user_token='))
      ?.split('=')[1];

    if (!whopToken) {
      return null;
    }

    // Validate token
    const tokenData = await validateToken({
      token: whopToken,
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
      merchant = await prisma.merchant.create({
        data: {
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
