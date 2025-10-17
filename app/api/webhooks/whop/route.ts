import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/crypto';
import { whopWebhookSchema } from '@/lib/validations';
import { queueEvent } from '@/lib/queue/event-queue';
import { getTierConfig, type SubscriptionTier } from '@/lib/subscription-tiers';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/whop
 * Handle webhooks from Whop for purchases and subscriptions
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const headersList = headers();

    // Verify webhook signature
    const signature = headersList.get('x-whop-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('WHOP_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse and validate webhook payload
    const body = JSON.parse(rawBody);

    let validatedData;
    try {
      validatedData = whopWebhookSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid webhook payload:', error.issues);
        return NextResponse.json(
          { error: 'Invalid payload', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }

    const { event, data } = validatedData;

    console.log(`Received Whop webhook: ${event}`, data);

    // Find merchant by Whop user ID
    const merchant = await prisma.merchant.findUnique({
      where: { whopUserId: data.user_id },
    });

    if (!merchant) {
      console.error(`Merchant not found for Whop user ${data.user_id}`);

      // Return 200 to acknowledge receipt (don't retry for unknown users)
      return NextResponse.json({
        success: true,
        message: 'Merchant not found',
      });
    }

    // Map Whop events to tracking events
    let eventName: string | null = null;
    let eventData: Record<string, unknown> = {
      orderId: data.id,
    };

    switch (event) {
      // Main conversion events for merchant's customers
      case 'payment_succeeded':
        eventName = 'Purchase';
        eventData.value = data.amount;
        eventData.currency = data.currency || 'USD';
        eventData.orderStatus = 'completed';
        break;

      case 'membership_went_valid':
        eventName = 'Subscribe';
        eventData.value = data.amount;
        eventData.currency = data.currency || 'USD';
        break;

      case 'membership_experience_claimed':
        eventName = 'Subscribe';
        eventData.value = data.amount;
        eventData.currency = data.currency || 'USD';
        eventData.orderStatus = 'claimed';
        break;

      case 'payment_pending':
        eventName = 'InitiateCheckout';
        eventData.value = data.amount;
        eventData.currency = data.currency || 'USD';
        break;

      // Events for PixelFlow app subscriptions (merchants paying for PixelFlow)
      case 'app_payment_succeeded':
        // Update merchant's subscription tier when they pay for PixelFlow
        console.log(`Merchant ${merchant.id} subscription payment succeeded`);
        // Note: Tier updates will be handled by app_membership_went_valid
        return NextResponse.json({
          success: true,
          message: 'App subscription payment processed',
        });

      case 'app_membership_went_valid':
        // Activate merchant's subscription and set correct limits
        console.log(`Merchant ${merchant.id} PixelFlow subscription went valid`);

        // Map Whop product IDs to subscription tiers
        const productTierMap: Record<string, SubscriptionTier> = {
          'prod_66Easm7HIbDH2': 'basic',
          'prod_tGpWLv7Oo4UZw': 'pro',
          'prod_tLvGU9oRsV8Ex': 'enterprise',
        };

        const productId = data.product_id;
        const newTier = productTierMap[productId] || 'free';
        const tierConfig = getTierConfig(newTier);

        // Update merchant's subscription tier and limits
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            subscriptionTier: newTier,
            monthlyEventLimit: tierConfig.eventLimit,
            // Reset event count if upgrading
            monthlyEventCount: 0,
            lastResetAt: new Date(),
          },
        });

        console.log(`Updated merchant ${merchant.id} to ${newTier} tier (${tierConfig.eventLimit} events/month)`);

        return NextResponse.json({
          success: true,
          message: 'App subscription activated',
          tier: newTier,
        });

      case 'app_membership_went_invalid':
        // Downgrade merchant to free tier
        console.log(`Merchant ${merchant.id} PixelFlow subscription went invalid`);

        const freeTierConfig = getTierConfig('free');

        await prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            subscriptionTier: 'free',
            monthlyEventLimit: freeTierConfig.eventLimit,
            // Don't reset event count - let them see their usage
          },
        });

        console.log(`Downgraded merchant ${merchant.id} to free tier (${freeTierConfig.eventLimit} events/month)`);

        return NextResponse.json({
          success: true,
          message: 'App subscription deactivated',
          tier: 'free',
        });

      // Events to log but not track as conversions
      case 'payment_failed':
      case 'membership_went_invalid':
      case 'membership_cancel_at_period_end_changed':
        console.log(`Logging event: ${event}`);
        return NextResponse.json({
          success: true,
          message: 'Event logged',
        });

      default:
        console.log(`Unknown event type: ${event}`);
        return NextResponse.json({
          success: true,
          message: 'Unknown event type',
        });
    }

    if (eventName) {
      // Create tracking event
      const trackingEvent = await prisma.trackingEvent.create({
        data: {
          merchantId: merchant.id,
          eventName,
          eventId: `whop_${data.id}_${Date.now()}`,
          eventSource: 'webhook',
          userId: data.user_id,
          value: typeof data.amount === 'number' ? data.amount / 100 : null, // Convert cents to dollars
          currency: data.currency || 'USD',
          customData: {
            whopEventType: event,
            productId: data.product_id,
            metadata: data.metadata,
          } as any,
          status: 'pending',
        },
      });

      // Queue event for processing
      await queueEvent({
        trackingEventId: trackingEvent.id,
        merchantId: merchant.id,
      });

      console.log(`Created tracking event ${trackingEvent.id} for Whop ${event}`);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });

  } catch (error) {
    console.error('Error processing Whop webhook:', error);

    // Return 500 to trigger retry from Whop
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
