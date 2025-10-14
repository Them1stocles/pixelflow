import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sub, format } from 'date-fns';
import { getMerchantFromRequest } from '@/lib/whop-auth';

/**
 * GET /api/stats
 * Get dashboard statistics for a merchant
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const merchantId = merchant.id;

    // Get date range (default: last 30 days)
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const startDate = sub(new Date(), { days });

    // Get total events count
    const totalEvents = await prisma.trackingEvent.count({
      where: {
        merchantId,
        createdAt: { gte: startDate },
      },
    });

    // Get event breakdown by type
    const eventBreakdown = await prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        merchantId,
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get page views count
    const pageViews = await prisma.trackingEvent.count({
      where: {
        merchantId,
        eventName: 'PageView',
        createdAt: { gte: startDate },
      },
    });

    // Get purchases count
    const purchases = await prisma.trackingEvent.count({
      where: {
        merchantId,
        eventName: 'Purchase',
        createdAt: { gte: startDate },
      },
    });

    // Calculate total revenue
    const revenueData = await prisma.trackingEvent.aggregate({
      where: {
        merchantId,
        eventName: 'Purchase',
        status: 'completed',
        createdAt: { gte: startDate },
      },
      _sum: {
        value: true,
      },
    });

    const totalRevenue = revenueData._sum.value || 0;

    // Get platform delivery stats
    const facebookStats = await prisma.trackingEvent.groupBy({
      by: ['facebookStatus'],
      where: {
        merchantId,
        createdAt: { gte: startDate },
        facebookStatus: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const tiktokStats = await prisma.trackingEvent.groupBy({
      by: ['tiktokStatus'],
      where: {
        merchantId,
        createdAt: { gte: startDate },
        tiktokStatus: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const googleStats = await prisma.trackingEvent.groupBy({
      by: ['googleStatus'],
      where: {
        merchantId,
        createdAt: { gte: startDate },
        googleStatus: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Calculate success rates
    const calculateSuccessRate = (stats: any[]) => {
      const success = stats.find(s => s.facebookStatus === 'success' || s.tiktokStatus === 'success' || s.googleStatus === 'success')?._count.id || 0;
      const failed = stats.find(s => s.facebookStatus === 'failed' || s.tiktokStatus === 'failed' || s.googleStatus === 'failed')?._count.id || 0;
      const total = success + failed;
      return total > 0 ? (success / total) * 100 : 0;
    };

    const platformStats = {
      facebook: {
        success: facebookStats.find(s => s.facebookStatus === 'success')?._count.id || 0,
        failed: facebookStats.find(s => s.facebookStatus === 'failed')?._count.id || 0,
        successRate: calculateSuccessRate(facebookStats),
      },
      tiktok: {
        success: tiktokStats.find(s => s.tiktokStatus === 'success')?._count.id || 0,
        failed: tiktokStats.find(s => s.tiktokStatus === 'failed')?._count.id || 0,
        successRate: calculateSuccessRate(tiktokStats),
      },
      google: {
        success: googleStats.find(s => s.googleStatus === 'success')?._count.id || 0,
        failed: googleStats.find(s => s.googleStatus === 'failed')?._count.id || 0,
        successRate: calculateSuccessRate(googleStats),
      },
    };

    // Get daily time series data
    const dailyData = await prisma.$queryRaw<Array<{
      date: Date;
      events: bigint;
      revenue: number;
    }>>`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as events,
        COALESCE(SUM(CASE WHEN event_name = 'Purchase' THEN value ELSE 0 END), 0) as revenue
      FROM tracking_events
      WHERE merchant_id = ${merchantId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Format daily data
    const formattedDailyData = dailyData.map(d => ({
      date: format(new Date(d.date), 'yyyy-MM-dd'),
      events: Number(d.events),
      revenue: Number(d.revenue),
    }));

    // Return dashboard stats
    return NextResponse.json({
      success: true,
      data: {
        totalEvents,
        pageViews,
        purchases,
        totalRevenue,
        currency: 'USD',
        platformStats,
        eventBreakdown: eventBreakdown.map(e => ({
          eventName: e.eventName,
          count: e._count.id,
        })),
        dailyData: formattedDailyData.reverse(),
      },
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
