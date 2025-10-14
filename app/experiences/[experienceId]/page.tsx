export const dynamic = 'force-dynamic';

import { requireWhopAuth } from '@/lib/whop-auth';
import { redirect } from 'next/navigation';

/**
 * Whop Experiences Route
 * This is the customer-facing view when users purchase access to PixelFlow
 * For our app, customers ARE merchants, so we redirect to dashboard
 */
export default async function ExperiencePage({
  params,
}: {
  params: { experienceId: string };
}) {
  // Authenticate with Whop
  const merchant = await requireWhopAuth();

  // For PixelFlow, the experience IS the dashboard
  // Redirect to dashboard with the merchant authenticated
  redirect('/dashboard');
}
