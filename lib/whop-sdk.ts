import { verifyUserToken as whopVerifyUserToken } from '@whop/api';

/**
 * Whop SDK Utilities
 * Uses @whop/api (correct package used by all working Whop apps)
 */

export interface TokenData {
  userId: string;
}

/**
 * Verify user token from headers
 * Passes through to @whop/api's verifyUserToken which handles Headers objects natively
 */
export async function verifyUserToken(
  headersOrRequest: Headers | Request
): Promise<TokenData> {
  // @whop/api's verifyUserToken accepts Headers or Request directly
  const tokenData = await whopVerifyUserToken(headersOrRequest);

  return {
    userId: tokenData.userId,
  };
}

// Re-export for direct use
export { whopVerifyUserToken };
