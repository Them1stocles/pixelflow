import { z } from 'zod';

/**
 * Validation schema for tracking events
 */
export const trackingEventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  merchantId: z.string().optional(), // Optional as it can be inferred from auth

  // Event source
  eventSource: z.enum(['browser', 'server', 'webhook']).default('browser'),
  eventSourceUrl: z.string().url().optional(),

  // User identification
  userId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),

  // Browser/device data
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),

  // E-commerce data
  value: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).default('USD'),
  contentIds: z.array(z.string()).optional(),
  contentName: z.string().optional(),
  contentCategory: z.string().optional(),
  numItems: z.number().int().min(0).optional(),

  // Custom properties
  customData: z.record(z.string(), z.unknown()).optional(),

  // Order/transaction data
  orderId: z.string().optional(),
  orderStatus: z.string().optional(),

  // Timestamp
  timestamp: z.number().optional(),
});

export type TrackingEventInput = z.infer<typeof trackingEventSchema>;

/**
 * Validation schema for pixel configuration
 */
export const pixelConfigSchema = z.object({
  platform: z.enum(['facebook', 'tiktok', 'google_analytics', 'snapchat', 'pinterest']),
  pixelId: z.string().min(1, 'Pixel ID is required'),
  accessToken: z.string().optional(),
  testEventCode: z.string().optional(),
  isActive: z.boolean().default(true),
  conversionApiEnabled: z.boolean().default(false),
});

export type PixelConfigInput = z.infer<typeof pixelConfigSchema>;

/**
 * Validation schema for updating pixel configuration
 */
export const updatePixelConfigSchema = pixelConfigSchema.partial().extend({
  id: z.string(),
});

/**
 * Validation schema for Whop webhooks
 */
export const whopWebhookSchema = z.object({
  event: z.enum([
    'payment.succeeded',
    'payment.failed',
    'membership.created',
    'membership.renewed',
    'membership.cancelled',
    'checkout.completed',
  ]),
  data: z.object({
    id: z.string(),
    user_id: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    product_id: z.string().optional(),
    status: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type WhopWebhookInput = z.infer<typeof whopWebhookSchema>;

/**
 * Validation schema for dashboard filters
 */
export const dashboardFiltersSchema = z.object({
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  eventName: z.string().optional(),
  platform: z.enum(['facebook', 'tiktok', 'google_analytics']).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

/**
 * Validation schema for pagination
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Validation schema for event list query
 */
export const eventListQuerySchema = paginationSchema.extend({
  filters: dashboardFiltersSchema.optional(),
});

/**
 * Validation schema for merchant registration
 */
export const merchantRegistrationSchema = z.object({
  whopUserId: z.string().min(1),
  whopCompanyId: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),
});

export type MerchantRegistrationInput = z.infer<typeof merchantRegistrationSchema>;

/**
 * Helper function to validate and parse data
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Helper function to format Zod validation errors for API responses
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.issues.forEach((error: any) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  });

  return formatted;
}
