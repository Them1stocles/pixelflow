import { redirect } from 'next/navigation';
import { getWhopSession } from '@/lib/whop-auth';

/**
 * Whop Experiences Route
 * This is the entry point when users access PixelFlow from their Whop dashboard
 * This route is loaded in an iframe on Whop
 *
 * We use server-side redirect to navigate to dashboard
 * This avoids React hydration issues that occur with client-side redirects
 */
export default async function ExperiencePage({
  params,
}: {
  params: { experienceId: string };
}) {
  // Validate authentication before redirecting
  console.log('[PixelFlow] Experience route accessed:', params.experienceId);

  const session = await getWhopSession();

  if (session) {
    console.log('[PixelFlow] Authenticated user, redirecting to dashboard');
  } else {
    console.log('[PixelFlow] No session found, redirecting to dashboard (auth check will happen there)');
  }

  // Server-side redirect - this is safe in iframes and avoids hydration issues
  redirect('/dashboard');
}
