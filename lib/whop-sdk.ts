import { WhopServerSdk } from "@whop/api";

/**
 * Whop Server SDK Instance
 *
 * This uses the modern @whop/api SDK (not the old @whop-apps/sdk)
 * Following the official whop-nextjs-app-template pattern
 */
export const whopSdk = WhopServerSdk({
  // App ID - used for token validation
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",

  // API Key - used for server-to-server API calls
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",

  // Optional: Agent user for making requests on behalf of
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,

  // Optional: Default company context
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
});
