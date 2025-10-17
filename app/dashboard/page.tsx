export const dynamic = 'force-dynamic';

import { getWhopSession, getWhopMerchant } from '@/lib/whop-auth';
import { Card } from '@/components/ui/card';
import { TrendingUp, Activity, ShoppingCart, DollarSign } from 'lucide-react';
import { UsageDisplay } from '@/components/usage-display';

async function getDashboardStats(merchantId: string) {
  const prisma = (await import('@/lib/prisma')).default;

  // Get total event count
  const totalEvents = await prisma.trackingEvent.count({
    where: { merchantId },
  });

  // Get event breakdown by type
  const eventBreakdown = await prisma.trackingEvent.groupBy({
    by: ['eventName'],
    where: { merchantId },
    _count: { eventName: true },
  });

  // Get platform delivery stats
  const events = await prisma.trackingEvent.findMany({
    where: { merchantId },
    select: {
      facebookStatus: true,
      tiktokStatus: true,
      googleStatus: true,
    },
  });

  // Calculate platform success rates
  const platformStats = {
    facebook: {
      success: events.filter(e => e.facebookStatus === 'success').length,
      failed: events.filter(e => e.facebookStatus === 'failed').length,
      successRate: 0,
    },
    tiktok: {
      success: events.filter(e => e.tiktokStatus === 'success').length,
      failed: events.filter(e => e.tiktokStatus === 'failed').length,
      successRate: 0,
    },
    google: {
      success: events.filter(e => e.googleStatus === 'success').length,
      failed: events.filter(e => e.googleStatus === 'failed').length,
      successRate: 0,
    },
  };

  // Calculate success rates
  Object.keys(platformStats).forEach(platform => {
    const stat = platformStats[platform as keyof typeof platformStats];
    const total = stat.success + stat.failed;
    stat.successRate = total > 0 ? (stat.success / total) * 100 : 0;
  });

  // Get revenue from purchase events
  const purchaseEvents = await prisma.trackingEvent.aggregate({
    where: {
      merchantId,
      eventName: 'Purchase',
    },
    _sum: { value: true },
    _count: { id: true },
  });

  return {
    totalEvents,
    pageViews: eventBreakdown.find(e => e.eventName === 'PageView')?._count.eventName || 0,
    purchases: purchaseEvents._count.id || 0,
    totalRevenue: purchaseEvents._sum.value || 0,
    currency: 'USD',
    platformStats,
    eventBreakdown: eventBreakdown.map(e => ({
      eventName: e.eventName,
      count: e._count.eventName,
    })),
  };
}

export default async function DashboardPage() {
  const session = await getWhopSession();
  const merchant = session ? await getWhopMerchant(session) : null;

  // If no merchant, show auth pending message (don't redirect externally!)
  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-lg p-8 text-center">
          <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            PixelFlow requires Whop authentication to function. This will be automatically enabled once the app is approved by Whop.
          </p>
          <p className="text-sm text-gray-500">
            If you&apos;re seeing this message after approval, please try refreshing the page or contact support.
          </p>
        </Card>
      </div>
    );
  }

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

      {/* Usage Display */}
      <UsageDisplay
        currentTier={merchant.subscriptionTier}
        monthlyEventCount={merchant.monthlyEventCount}
        monthlyEventLimit={merchant.monthlyEventLimit}
        showUpgradePrompt={true}
      />

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
