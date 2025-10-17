import { validateToken, hasAccess } from '@whop-apps/sdk';

/**
 * Whop SDK Utilities
 * Uses @whop-apps/sdk with correct async/await pattern
 */

export interface TokenData {
  userId: string;
  appId?: string;
}

/**
 * Verify user token from headers
 * This wraps validateToken with proper async handling
 */
export async function verifyUserToken(headers: any): Promise<TokenData> {
  // await the headers() function call if it's a function
  const headersList = typeof headers === 'function' ? await headers() : headers;

  // Call validateToken with the headers object
  const tokenData = await validateToken({ headers: headersList });

  return {
    userId: tokenData.userId,
    appId: tokenData.appId,
  };
}

/**
 * Check if user has access to experience
 */
export async function checkUserAccess(experienceId: string, headers: any): Promise<boolean> {
  const headersList = typeof headers === 'function' ? await headers() : headers;

  const access = await hasAccess({
    to: experienceId,
    headers: headersList,
  });

  return access;
}

// Export SDK functions for direct use
export { validateToken, hasAccess };
