import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { checkRateLimit, checkDuplication, RATE_LIMITS } from '@/lib/rate-limit';
import { generateEventId } from '@/lib/crypto';
import { normalizeEventName } from '@/lib/event-mapping';
import { trackingEventSchema } from '@/lib/validations';
import { queueEvent } from '@/lib/queue/event-queue';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * POST /api/track
 * Main endpoint for tracking events from browser and server
 */
export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    // Rate limiting
    const rateLimitResult = await checkRateLimit({
      identifier: ip,
      ...RATE_LIMITS.track,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.track.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    let validatedData;
    try {
      validatedData = trackingEventSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request data',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get merchant ID from request
    // In production, this would come from authentication or pixel ID
    let merchantId = validatedData.merchantId;

    if (!merchantId) {
      // Try to get from custom header or query param
      merchantId = req.headers.get('x-merchant-id') ||
                   req.nextUrl.searchParams.get('merchantId') || '';
    }

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Verify merchant exists and is active
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        subscriptionTier: true,
        monthlyEventLimit: true,
        monthlyEventCount: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 404 }
      );
    }

    // Check monthly event limit (skip check for unlimited tier)
    // Unlimited tier is represented by -1
    if (merchant.monthlyEventLimit !== -1 && merchant.monthlyEventCount >= merchant.monthlyEventLimit) {
      return NextResponse.json(
        {
          error: 'Monthly event limit reached',
          limit: merchant.monthlyEventLimit,
          current: merchant.monthlyEventCount,
          upgrade: true,
        },
        { status: 429 }
      );
    }

    // Normalize event name
    const eventName = normalizeEventName(validatedData.eventName);

    // Extract user data from request if not provided
    const userAgent = validatedData.userAgent || req.headers.get('user-agent') || undefined;
    const ipAddress = validatedData.ipAddress || ip;

    // Generate deterministic event ID for deduplication
    const timestamp = validatedData.timestamp || Date.now();
    const eventId = generateEventId({
      merchantId,
      eventName,
      userId: validatedData.userId,
      orderId: validatedData.orderId,
      timestamp,
      value: validatedData.value,
      contentIds: validatedData.contentIds,
    });

    // Check for duplicate events
    const dupCheck = await checkDuplication({ eventId });

    if (dupCheck.isDuplicate) {
      console.log(`Duplicate event detected: ${eventId}`);

      // Return success to client (event was already processed)
      return NextResponse.json({
        success: true,
        eventId,
        message: 'Event already processed (duplicate)',
        duplicate: true,
      });
    }

    // Create tracking event in database
    const trackingEvent = await prisma.trackingEvent.create({
      data: {
        merchantId,
        eventName,
        eventId,
        eventSource: validatedData.eventSource,
        eventSourceUrl: validatedData.eventSourceUrl,
        userId: validatedData.userId,
        email: validatedData.email,
        phone: validatedData.phone,
        userAgent,
        ipAddress,
        fbp: validatedData.fbp,
        fbc: validatedData.fbc,
        value: validatedData.value,
        currency: validatedData.currency,
        contentIds: validatedData.contentIds || [],
        contentName: validatedData.contentName,
        contentCategory: validatedData.contentCategory,
        numItems: validatedData.numItems,
        customData: validatedData.customData as any,
        status: 'pending',
      },
    });

    // Increment merchant event count
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        monthlyEventCount: {
          increment: 1,
        },
      },
    });

    // Queue event for processing
    await queueEvent({
      trackingEventId: trackingEvent.id,
      merchantId,
    });

    // Return success immediately (event will be processed asynchronously)
    return NextResponse.json(
      {
        success: true,
        eventId: trackingEvent.id,
        message: 'Event queued for processing',
      },
      {
        status: 202, // Accepted
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.track.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      }
    );

  } catch (error) {
    console.error('Error in /api/track:', error);

    // Don't leak internal errors to client
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process tracking event',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/track
 * CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Merchant-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}
