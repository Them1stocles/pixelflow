'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Whop Experiences Route
 * This is the entry point when users access PixelFlow from their Whop dashboard
 * This route is loaded in an iframe on Whop
 *
 * We use client-side redirect to navigate to dashboard within the iframe
 * Server-side redirects can cause issues with iframe embedding
 */
export default function ExperiencePage({
  params,
}: {
  params: { experienceId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // Client-side navigation within the iframe
    router.replace('/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Loading PixelFlow...</p>
      </div>
    </div>
  );
}
