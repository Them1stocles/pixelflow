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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Welcome to PixelFlow</h2>
            <p className="mt-2 text-gray-600">
              You need to be logged into Whop to access this app
            </p>
            <p className="mt-1 text-xs text-gray-400">v1.0.3</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This app is designed to run inside the Whop platform. Please access it through your Whop dashboard.
            </p>

            <a
              href="https://whop.com"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Whop
            </a>
          </div>

          <p className="text-xs text-center text-gray-500">
            For local development, use the Whop dev proxy
          </p>
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
