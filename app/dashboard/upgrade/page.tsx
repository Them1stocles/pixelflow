export const dynamic = 'force-dynamic';

import { requireWhopAuth } from '@/lib/whop-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TIER_CONFIGS,
  getTierConfig,
  getUpgradeUrl,
  formatEventCount,
  type SubscriptionTier,
} from '@/lib/subscription-tiers';
import { Check, Zap, ArrowRight } from 'lucide-react';

export default async function UpgradePage() {
  const merchant = await requireWhopAuth();
  const currentTier = merchant.subscriptionTier.toLowerCase() as SubscriptionTier;
  const currentTierConfig = getTierConfig(currentTier);

  // Get tier order for comparison
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const currentTierIndex = tierOrder.indexOf(currentTier);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Upgrade Your Plan</h1>
        <p className="text-gray-600 mt-2 text-lg">
          You&apos;re currently on the <span className="font-semibold">{currentTierConfig.displayName}</span> plan
        </p>
        <p className="text-gray-600 mt-1">
          Choose the plan that fits your tracking needs
        </p>
      </div>

      {/* Current Usage */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Current Usage</h3>
            <p className="text-gray-700 mt-1">
              {formatEventCount(merchant.monthlyEventCount)} / {formatEventCount(merchant.monthlyEventLimit)} events this month
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {merchant.monthlyEventLimit === -1
              ? '∞'
              : `${Math.round((merchant.monthlyEventCount / merchant.monthlyEventLimit) * 100)}%`}
          </div>
        </div>
      </Card>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tierOrder.map((tier) => {
          const config = TIER_CONFIGS[tier];
          const isCurrent = tier === currentTier;
          const isDowngrade = tierOrder.indexOf(tier) < currentTierIndex;
          const isRecommended = config.recommended;

          return (
            <Card
              key={tier}
              className={`relative p-6 ${
                isCurrent
                  ? 'border-blue-500 border-2 bg-blue-50'
                  : isRecommended
                  ? 'border-purple-500 border-2'
                  : ''
              }`}
            >
              {/* Recommended Badge */}
              {isRecommended && !isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {/* Tier Name */}
                <div>
                  <h3 className="text-2xl font-bold">{config.displayName}</h3>
                  {config.eventLimit === -1 && (
                    <div className="flex items-center gap-1 text-purple-600 mt-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-semibold">Unlimited</span>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${config.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatEventCount(config.eventLimit)} events/month
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {config.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      disabled
                      className="w-full"
                      variant="outline"
                    >
                      Contact Support to Downgrade
                    </Button>
                  ) : tier === 'free' ? (
                    <Button disabled className="w-full" variant="outline">
                      Free Forever
                    </Button>
                  ) : (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                      <a href={getUpgradeUrl(tier)}>
                        Upgrade Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">What happens if I exceed my monthly limit?</h3>
            <p className="text-gray-700 mt-1">
              Once you reach your monthly event limit, new events will not be tracked until you upgrade your plan or wait for the next billing cycle. You&apos;ll receive warnings at 80% and 90% usage to give you time to upgrade.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Can I change plans at any time?</h3>
            <p className="text-gray-700 mt-1">
              Yes! You can upgrade your plan at any time. Upgrades take effect immediately. If you need to downgrade, please contact our support team.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">What counts as an event?</h3>
            <p className="text-gray-700 mt-1">
              Each tracked action counts as one event. This includes page views, product views, add to cart actions, purchases, and any custom events you track. All Whop purchases are automatically tracked via webhooks and count toward your limit.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Do unused events roll over?</h3>
            <p className="text-gray-700 mt-1">
              No, event limits reset at the beginning of each billing cycle. Unused events do not roll over to the next month.
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-gray-600">
          Need help choosing the right plan?{' '}
          <a href="mailto:support@pixelflow.com" className="text-blue-600 hover:underline font-semibold">
            Contact our team
          </a>
        </p>
      </div>
    </div>
  );
}
