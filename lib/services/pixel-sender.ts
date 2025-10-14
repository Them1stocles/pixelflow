import { hashEmail, hashPhone } from '../crypto';
import { mapEventName } from '../event-mapping';
import type {
  FacebookConversionPayload,
  TikTokEventPayload,
  GA4EventPayload,
} from '../types';
import prisma from '../prisma';

interface SendEventParams {
  trackingEventId: string;
  merchantId: string;
}

interface EventData {
  id: string;
  eventName: string;
  eventSource: string;
  eventSourceUrl: string | null;
  userId: string | null;
  email: string | null;
  phone: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  fbp: string | null;
  fbc: string | null;
  value: number | null;
  currency: string | null;
  contentIds: string[];
  contentName: string | null;
  contentCategory: string | null;
  numItems: number | null;
  customData: unknown;
  createdAt: Date;
}

/**
 * PixelSender Service
 * Sends tracking events to Facebook, TikTok, and Google Analytics
 */
export class PixelSender {
  /**
   * Send event to all configured platforms
   */
  async sendToAllPlatforms(params: SendEventParams): Promise<void> {
    const { trackingEventId, merchantId } = params;

    try {
      // Get tracking event
      const event = await prisma.trackingEvent.findUnique({
        where: { id: trackingEventId },
      });

      if (!event) {
        throw new Error(`Tracking event ${trackingEventId} not found`);
      }

      // Get all active pixel configurations for this merchant
      const pixelConfigs = await prisma.pixelConfig.findMany({
        where: {
          merchantId,
          isActive: true,
        },
      });

      if (pixelConfigs.length === 0) {
        console.log(`No active pixel configurations for merchant ${merchantId}`);
        return;
      }

      // Send to each platform
      const promises = pixelConfigs.map(async (config) => {
        if (!config.conversionApiEnabled) {
          console.log(`Conversion API disabled for ${config.platform}`);
          return;
        }

        try {
          switch (config.platform) {
            case 'facebook':
              await this.sendToFacebook(event as unknown as EventData, config);
              break;
            case 'tiktok':
              await this.sendToTikTok(event as unknown as EventData, config);
              break;
            case 'google_analytics':
              await this.sendToGoogleAnalytics(event as unknown as EventData, config);
              break;
            default:
              console.log(`Platform ${config.platform} not yet implemented`);
          }
        } catch (error) {
          console.error(`Error sending to ${config.platform}:`, error);
          throw error;
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error in sendToAllPlatforms:', error);
      throw error;
    }
  }

  /**
   * Send event to Facebook Conversions API
   */
  async sendToFacebook(
    event: EventData,
    config: { pixelId: string; accessToken: string | null; testEventCode: string | null }
  ): Promise<void> {
    if (!config.accessToken) {
      throw new Error('Facebook access token not configured');
    }

    const eventTime = Math.floor(new Date(event.createdAt).getTime() / 1000);

    // Hash user data for privacy
    const userData: Record<string, unknown> = {};

    if (event.email) {
      userData.em = hashEmail(event.email);
    }
    if (event.phone) {
      userData.ph = hashPhone(event.phone);
    }
    if (event.ipAddress) {
      userData.client_ip_address = event.ipAddress;
    }
    if (event.userAgent) {
      userData.client_user_agent = event.userAgent;
    }
    if (event.fbc) {
      userData.fbc = event.fbc;
    }
    if (event.fbp) {
      userData.fbp = event.fbp;
    }
    if (event.userId) {
      userData.external_id = event.userId;
    }

    // Build custom data
    const customData: Record<string, unknown> = {};

    if (event.value !== null) {
      customData.value = event.value;
    }
    if (event.currency) {
      customData.currency = event.currency;
    }
    if (event.contentIds.length > 0) {
      customData.content_ids = event.contentIds;
      customData.content_type = 'product';
    }
    if (event.contentName) {
      customData.content_name = event.contentName;
    }
    if (event.contentCategory) {
      customData.content_category = event.contentCategory;
    }
    if (event.numItems !== null) {
      customData.num_items = event.numItems;
    }

    // Merge with custom data from event
    if (event.customData && typeof event.customData === 'object') {
      Object.assign(customData, event.customData);
    }

    // Build payload
    const payload: FacebookConversionPayload = {
      data: [
        {
          event_name: mapEventName(event.eventName, 'facebook'),
          event_time: eventTime,
          event_source_url: event.eventSourceUrl || undefined,
          action_source: event.eventSource === 'browser' ? 'website' : 'email',
          user_data: userData,
          custom_data: Object.keys(customData).length > 0 ? customData : undefined,
          event_id: event.id,
        },
      ],
    };

    // Add test event code if configured
    if (config.testEventCode) {
      payload.test_event_code = config.testEventCode;
    }

    // Send to Facebook
    const url = `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Facebook returns 200 OK even with errors, check response body
    if (data.error || (data.events_received === 0 && data.messages)) {
      const errorMsg = data.error?.message || JSON.stringify(data.messages);
      throw new Error(`Facebook API error: ${errorMsg}`);
    }

    // Update tracking event status
    await prisma.trackingEvent.update({
      where: { id: event.id },
      data: {
        facebookStatus: 'success',
        facebookSentAt: new Date(),
      },
    });

    // Log success
    await prisma.eventLog.create({
      data: {
        merchantId: (await prisma.trackingEvent.findUnique({
          where: { id: event.id },
          select: { merchantId: true },
        }))!.merchantId,
        trackingEventId: event.id,
        level: 'info',
        message: 'Event sent to Facebook successfully',
        platform: 'facebook',
        requestPayload: payload as any,
        responsePayload: data,
      },
    });

    console.log(`✓ Sent event ${event.id} to Facebook`);
  }

  /**
   * Send event to TikTok Events API
   */
  async sendToTikTok(
    event: EventData,
    config: { pixelId: string; accessToken: string | null; testEventCode: string | null }
  ): Promise<void> {
    if (!config.accessToken) {
      throw new Error('TikTok access token not configured');
    }

    const eventTime = Math.floor(new Date(event.createdAt).getTime() / 1000);

    // Hash user data
    const user: Record<string, unknown> = {};

    if (event.email) {
      user.email = hashEmail(event.email);
    }
    if (event.phone) {
      user.phone_number = hashPhone(event.phone);
    }
    if (event.ipAddress) {
      user.ip = event.ipAddress;
    }
    if (event.userAgent) {
      user.user_agent = event.userAgent;
    }
    if (event.userId) {
      user.external_id = event.userId;
    }

    // Build properties
    const properties: Record<string, unknown> = {};

    if (event.value !== null) {
      properties.value = event.value;
    }
    if (event.currency) {
      properties.currency = event.currency;
    }
    if (event.contentIds.length > 0) {
      properties.content_id = event.contentIds[0]; // TikTok uses single content_id
      properties.content_type = 'product';
    }
    if (event.contentName) {
      properties.content_name = event.contentName;
    }
    if (event.contentCategory) {
      properties.content_category = event.contentCategory;
    }
    if (event.numItems !== null) {
      properties.quantity = event.numItems;
    }

    // Merge custom data
    if (event.customData && typeof event.customData === 'object') {
      Object.assign(properties, event.customData);
    }

    // Build payload
    const payload: TikTokEventPayload = {
      event_source: 'web',
      event_source_id: config.pixelId,
      data: [
        {
          event: mapEventName(event.eventName, 'tiktok'),
          event_time: eventTime,
          event_id: event.id,
          user,
          properties: Object.keys(properties).length > 0 ? properties : undefined,
          page: event.eventSourceUrl ? { url: event.eventSourceUrl } : undefined,
        },
      ],
    };

    // Add test event code if configured
    if (config.testEventCode) {
      payload.test_event_code = config.testEventCode;
    }

    // Send to TikTok
    const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': config.accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Check for errors
    if (data.code !== 0) {
      throw new Error(`TikTok API error: ${data.message || JSON.stringify(data)}`);
    }

    // Update tracking event status
    await prisma.trackingEvent.update({
      where: { id: event.id },
      data: {
        tiktokStatus: 'success',
        tiktokSentAt: new Date(),
      },
    });

    // Log success
    await prisma.eventLog.create({
      data: {
        merchantId: (await prisma.trackingEvent.findUnique({
          where: { id: event.id },
          select: { merchantId: true },
        }))!.merchantId,
        trackingEventId: event.id,
        level: 'info',
        message: 'Event sent to TikTok successfully',
        platform: 'tiktok',
        requestPayload: payload as any,
        responsePayload: data,
      },
    });

    console.log(`✓ Sent event ${event.id} to TikTok`);
  }

  /**
   * Send event to Google Analytics 4
   */
  async sendToGoogleAnalytics(
    event: EventData,
    config: { pixelId: string; accessToken: string | null }
  ): Promise<void> {
    // For GA4, pixelId is the Measurement ID (G-XXXXXXXXXX)
    // accessToken is the API Secret

    if (!config.accessToken) {
      throw new Error('Google Analytics API secret not configured');
    }

    const clientId = event.userId || event.fbp || `guest_${event.id}`;

    // Build event parameters
    const params: Record<string, unknown> = {};

    if (event.value !== null) {
      params.value = event.value;
    }
    if (event.currency) {
      params.currency = event.currency;
    }

    // Add items for e-commerce events
    if (event.contentIds.length > 0) {
      params.items = event.contentIds.map((id, index) => ({
        item_id: id,
        item_name: event.contentName || `Product ${index + 1}`,
        item_category: event.contentCategory,
        quantity: event.numItems || 1,
        price: event.value,
      }));
    }

    // Merge custom data
    if (event.customData && typeof event.customData === 'object') {
      Object.assign(params, event.customData);
    }

    // Build payload
    const payload: GA4EventPayload = {
      client_id: clientId,
      user_id: event.userId || undefined,
      events: [
        {
          name: mapEventName(event.eventName, 'google'),
          params,
        },
      ],
    };

    // Send to Google Analytics
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${config.pixelId}&api_secret=${config.accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // GA4 returns 204 No Content on success
    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      throw new Error(`Google Analytics API error: ${response.status} ${text}`);
    }

    // Update tracking event status
    await prisma.trackingEvent.update({
      where: { id: event.id },
      data: {
        googleStatus: 'success',
        googleSentAt: new Date(),
      },
    });

    // Log success
    await prisma.eventLog.create({
      data: {
        merchantId: (await prisma.trackingEvent.findUnique({
          where: { id: event.id },
          select: { merchantId: true },
        }))!.merchantId,
        trackingEventId: event.id,
        level: 'info',
        message: 'Event sent to Google Analytics successfully',
        platform: 'google',
        requestPayload: payload as any,
      },
    });

    console.log(`✓ Sent event ${event.id} to Google Analytics`);
  }

  /**
   * Handle failed event delivery
   */
  async handleFailure(
    eventId: string,
    platform: string,
    error: Error
  ): Promise<void> {
    const event = await prisma.trackingEvent.findUnique({
      where: { id: eventId },
      select: { merchantId: true },
    });

    if (!event) return;

    // Update event status based on platform
    const updateData: Record<string, unknown> = {};

    switch (platform) {
      case 'facebook':
        updateData.facebookStatus = 'failed';
        break;
      case 'tiktok':
        updateData.tiktokStatus = 'failed';
        break;
      case 'google':
        updateData.googleStatus = 'failed';
        break;
    }

    await prisma.trackingEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    // Log error
    await prisma.eventLog.create({
      data: {
        merchantId: event.merchantId,
        trackingEventId: eventId,
        level: 'error',
        message: `Failed to send event to ${platform}`,
        platform,
        errorMessage: error.message,
        stackTrace: error.stack,
      },
    });

    console.error(`✗ Failed to send event ${eventId} to ${platform}:`, error.message);
  }
}

export const pixelSender = new PixelSender();
