export const dynamic = 'force-dynamic';

import { requireWhopAuth } from '@/lib/whop-auth';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity, ShoppingCart, DollarSign } from 'lucide-react';

async function getDashboardStats(merchantId: string) {
  // In a real app, this would call the API
  // For now, return mock data
  return {
    totalEvents: 1234,
    pageViews: 856,
    purchases: 23,
    totalRevenue: 2456.78,
    currency: 'USD',
    platformStats: {
      facebook: { success: 1100, failed: 10, successRate: 99.1 },
      tiktok: { success: 1050, failed: 15, successRate: 98.6 },
      google: { success: 1150, failed: 5, successRate: 99.6 },
    },
    eventBreakdown: [
      { eventName: 'PageView', count: 856 },
      { eventName: 'ViewContent', count: 234 },
      { eventName: 'AddToCart', count: 121 },
      { eventName: 'Purchase', count: 23 },
    ],
  };
}

export default async function DashboardPage() {
  const merchant = await requireWhopAuth();
  const stats = await getDashboardStats(merchant.id);

  const statCards = [
    {
      name: 'Total Events',
      value: stats.totalEvents.toLocaleString(),
      icon: Activity,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: 'Page Views',
      value: stats.pageViews.toLocaleString(),
      icon: TrendingUp,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      name: 'Purchases',
      value: stats.purchases.toLocaleString(),
      icon: ShoppingCart,
      change: '+23%',
      changeType: 'positive' as const,
    },
    {
      name: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: '+18%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {merchant.name || merchant.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Platform Delivery Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Platform Delivery Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(stats.platformStats).map(([platform, data]) => (
            <div key={platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{platform}</span>
                <span className="text-sm text-gray-600">
                  {data.successRate.toFixed(1)}% success
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${data.successRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{data.success} successful</span>
                <span>{data.failed} failed</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Event Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Event Breakdown</h2>
        <div className="space-y-3">
          {stats.eventBreakdown.map((event) => {
            const percentage = (event.count / stats.totalEvents) * 100;
            return (
              <div key={event.eventName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{event.eventName}</span>
                  <span className="text-sm text-gray-600">
                    {event.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/pixels"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium">Configure Pixels</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add Facebook, TikTok, or Google Analytics pixels
            </p>
          </a>

          <a
            href="/dashboard/installation"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium">Get Tracking Script</h3>
            <p className="text-sm text-gray-600 mt-1">
              Copy your pixel script to install on your site
            </p>
          </a>

          <a
            href="/dashboard/events"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium">View Events</h3>
            <p className="text-sm text-gray-600 mt-1">
              See all tracked events and their delivery status
            </p>
          </a>
        </div>
      </Card>
    </div>
  );
}
