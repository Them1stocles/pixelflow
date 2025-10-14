/**
 * Event name mappings for different platforms
 * Each platform uses slightly different event naming conventions
 */

// Standard event names used internally
export type StandardEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Subscribe'
  | 'StartTrial'
  | 'CompleteRegistration'
  | 'Lead'
  | 'Search';

// Facebook Conversions API event names
export const FACEBOOK_EVENT_MAP: Record<StandardEventName, string> = {
  PageView: 'PageView',
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'Purchase',
  Subscribe: 'Subscribe',
  StartTrial: 'StartTrial',
  CompleteRegistration: 'CompleteRegistration',
  Lead: 'Lead',
  Search: 'Search',
};

// TikTok Events API event names (different from Facebook)
export const TIKTOK_EVENT_MAP: Record<StandardEventName, string> = {
  PageView: 'PageView',
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'CompletePayment', // TikTok uses CompletePayment instead of Purchase
  Subscribe: 'Subscribe',
  StartTrial: 'StartTrial',
  CompleteRegistration: 'CompleteRegistration',
  Lead: 'SubmitForm', // TikTok uses SubmitForm instead of Lead
  Search: 'Search',
};

// Google Analytics 4 event names
export const GA4_EVENT_MAP: Record<StandardEventName, string> = {
  PageView: 'page_view',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  Subscribe: 'subscribe',
  StartTrial: 'start_trial',
  CompleteRegistration: 'sign_up',
  Lead: 'generate_lead',
  Search: 'search',
};

/**
 * Map standard event name to platform-specific event name
 */
export function mapEventName(
  standardName: string,
  platform: 'facebook' | 'tiktok' | 'google'
): string {
  const eventName = standardName as StandardEventName;

  switch (platform) {
    case 'facebook':
      return FACEBOOK_EVENT_MAP[eventName] || standardName;
    case 'tiktok':
      return TIKTOK_EVENT_MAP[eventName] || standardName;
    case 'google':
      return GA4_EVENT_MAP[eventName] || standardName;
    default:
      return standardName;
  }
}

/**
 * Normalize event name from various sources to standard format
 */
export function normalizeEventName(eventName: string): string {
  // Convert snake_case and kebab-case to PascalCase
  const normalized = eventName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Map common variations to standard names
  const variations: Record<string, StandardEventName> = {
    pageview: 'PageView',
    page_view: 'PageView',
    viewcontent: 'ViewContent',
    view_content: 'ViewContent',
    addtocart: 'AddToCart',
    add_to_cart: 'AddToCart',
    initiatecheckout: 'InitiateCheckout',
    initiate_checkout: 'InitiateCheckout',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
    completepayment: 'Purchase',
    complete_payment: 'Purchase',
    subscribe: 'Subscribe',
    subscription: 'Subscribe',
    starttrial: 'StartTrial',
    start_trial: 'StartTrial',
    completeregistration: 'CompleteRegistration',
    complete_registration: 'CompleteRegistration',
    signup: 'CompleteRegistration',
    sign_up: 'CompleteRegistration',
    lead: 'Lead',
    generatelead: 'Lead',
    generate_lead: 'Lead',
    submitform: 'Lead',
    submit_form: 'Lead',
    search: 'Search',
  };

  return variations[normalized.toLowerCase()] || normalized;
}
