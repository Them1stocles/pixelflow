import { StandardEventName } from './event-mapping';

/**
 * Tracking event data structure
 */
export interface TrackingEventData {
  // Required fields
  eventName: StandardEventName | string;
  merchantId: string;

  // Event source
  eventSource: 'browser' | 'server' | 'webhook';
  eventSourceUrl?: string;

  // User identification (at least one should be provided)
  userId?: string;
  email?: string;
  phone?: string;

  // Browser/device data
  userAgent?: string;
  ipAddress?: string;
  fbp?: string; // Facebook browser pixel
  fbc?: string; // Facebook click ID

  // E-commerce data
  value?: number;
  currency?: string;
  contentIds?: string[]; // Product IDs
  contentName?: string;
  contentCategory?: string;
  numItems?: number;

  // Custom properties
  customData?: Record<string, unknown>;

  // Order/transaction data
  orderId?: string;
  orderStatus?: string;

  // Timestamp
  timestamp?: number;
}

/**
 * Pixel configuration data
 */
export interface PixelConfigData {
  id?: string;
  merchantId: string;
  platform: 'facebook' | 'tiktok' | 'google_analytics' | 'snapchat' | 'pinterest';
  pixelId: string;
  accessToken?: string;
  testEventCode?: string;
  isActive?: boolean;
  conversionApiEnabled?: boolean;
}

/**
 * Facebook Conversions API payload
 */
export interface FacebookConversionPayload {
  data: Array<{
    event_name: string;
    event_time: number;
    event_source_url?: string;
    action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
    user_data: {
      em?: string; // Hashed email
      ph?: string; // Hashed phone
      client_ip_address?: string;
      client_user_agent?: string;
      fbc?: string;
      fbp?: string;
      external_id?: string;
    };
    custom_data?: {
      value?: number;
      currency?: string;
      content_ids?: string[];
      content_name?: string;
      content_category?: string;
      content_type?: string;
      num_items?: number;
      [key: string]: unknown;
    };
    event_id?: string;
  }>;
  test_event_code?: string;
}

/**
 * TikTok Events API payload
 */
export interface TikTokEventPayload {
  event_source: 'web';
  event_source_id: string; // Pixel ID
  data: Array<{
    event: string;
    event_time: number;
    event_id?: string;
    user: {
      email?: string; // Hashed
      phone_number?: string; // Hashed
      ip?: string;
      user_agent?: string;
      external_id?: string;
    };
    properties?: {
      value?: number;
      currency?: string;
      content_type?: string;
      content_id?: string;
      content_name?: string;
      content_category?: string;
      quantity?: number;
      [key: string]: unknown;
    };
    page?: {
      url?: string;
    };
  }>;
  test_event_code?: string;
}

/**
 * Google Analytics 4 Measurement Protocol payload
 */
export interface GA4EventPayload {
  client_id: string;
  user_id?: string;
  timestamp_micros?: number;
  user_properties?: Record<string, { value: unknown }>;
  events: Array<{
    name: string;
    params: {
      value?: number;
      currency?: string;
      items?: Array<{
        item_id?: string;
        item_name?: string;
        item_category?: string;
        quantity?: number;
        price?: number;
      }>;
      [key: string]: unknown;
    };
  }>;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalEvents: number;
  pageViews: number;
  purchases: number;
  totalRevenue: number;
  currency: string;

  // Platform delivery stats
  platformStats: {
    facebook: {
      success: number;
      failed: number;
      successRate: number;
    };
    tiktok: {
      success: number;
      failed: number;
      successRate: number;
    };
    google: {
      success: number;
      failed: number;
      successRate: number;
    };
  };

  // Event breakdown
  eventBreakdown: Array<{
    eventName: string;
    count: number;
  }>;

  // Time series data for charts
  dailyData: Array<{
    date: string;
    events: number;
    revenue: number;
  }>;
}

/**
 * Whop webhook event types
 */
export type WhopWebhookEvent =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'membership.created'
  | 'membership.renewed'
  | 'membership.cancelled'
  | 'checkout.completed';

export interface WhopWebhookPayload {
  event: WhopWebhookEvent;
  data: {
    id: string;
    user_id: string;
    amount?: number;
    currency?: string;
    product_id?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * BullMQ job data types
 */
export interface TrackingEventJob {
  trackingEventId: string;
  merchantId: string;
  retry?: boolean;
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Session/Auth types
 */
export interface SessionUser {
  id: string;
  whopUserId: string;
  email: string;
  name?: string;
  subscriptionTier: string;
}
