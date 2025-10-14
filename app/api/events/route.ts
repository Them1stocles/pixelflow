import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { eventListQuerySchema } from '@/lib/validations';
import { getMerchantFromRequest } from '@/lib/whop-auth';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Get tracking events for a merchant with pagination and filtering
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

    // Parse query parameters
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const eventName = req.nextUrl.searchParams.get('eventName');
    const status = req.nextUrl.searchParams.get('status');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    // Build where clause
    const where: any = { merchantId: merchant.id };

    if (eventName) {
      where.eventName = eventName;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.trackingEvent.count({ where });

    // Get paginated events
    const events = await prisma.trackingEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        eventName: true,
        eventSource: true,
        value: true,
        currency: true,
        status: true,
        facebookStatus: true,
        tiktokStatus: true,
        googleStatus: true,
        createdAt: true,
        processedAt: true,
        retryCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
