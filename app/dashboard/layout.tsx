export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getWhopSession, getWhopMerchant } from '@/lib/whop-auth';
import {
  LayoutDashboard,
  Settings,
  Activity,
  Code,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check Whop authentication
  const session = await getWhopSession();
  const merchant = session ? await getWhopMerchant(session) : null;

  // Show login prompt if not authenticated
  const showLoginPrompt = !session || !merchant;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pixels', href: '/dashboard/pixels', icon: Settings },
    { name: 'Events', href: '/dashboard/events', icon: Activity },
    { name: 'Installation', href: '/dashboard/installation', icon: Code },
  ];

  if (showLoginPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">PixelFlow</h2>
              <p className="text-sm text-gray-500 mt-1">Pixel Tracking & Conversion API</p>
              <p className="text-xs text-gray-400 mt-1">v1.0.5</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-lg text-blue-900 mb-3">
                App Pending Whop Approval
              </h3>
              <p className="text-gray-700 mb-4">
                PixelFlow is currently under review by the Whop team. Authentication will be automatically enabled once the app is approved and published to the Whop App Store.
              </p>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>For Whop Reviewers:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>This app uses Whop SDK authentication (<code className="bg-blue-100 px-1 rounded">@whop-apps/sdk</code>)</li>
                  <li>Cloudflare proxy injection is required for production authentication</li>
                  <li>Authentication will work automatically after app approval</li>
                  <li>Local testing uses <code className="bg-blue-100 px-1 rounded">@whop-apps/dev-proxy</code></li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features & Capabilities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">Automatic Facebook Pixel & CAPI tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">TikTok Events API integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">Google Analytics 4 tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">Real-time event monitoring</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">Server-side conversion tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">Multi-tier subscription plans (Free/Basic/Pro/Enterprise)</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 text-center">
                PixelFlow automatically tracks all Whop purchases, subscriptions, and group joins via webhooks. No manual setup required for merchants.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            PixelFlow
          </Link>
          <p className="text-sm text-gray-600 mt-1">{merchant?.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <a
            href="https://whop.com"
            className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Back to Whop
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
