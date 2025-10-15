'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getTierConfig,
  getUsagePercentage,
  getWarningLevel,
  getNextTier,
  formatEventCount,
  type SubscriptionTier,
  type WarningLevel,
} from '@/lib/subscription-tiers';
import { AlertTriangle, TrendingUp, Zap, ArrowRight } from 'lucide-react';

interface UsageDisplayProps {
  currentTier: string;
  monthlyEventCount: number;
  monthlyEventLimit: number;
  showUpgradePrompt?: boolean;
}

export function UsageDisplay({
  currentTier,
  monthlyEventCount,
  monthlyEventLimit,
  showUpgradePrompt = true,
}: UsageDisplayProps) {
  const tierConfig = getTierConfig(currentTier);
  const usagePercentage = getUsagePercentage(monthlyEventCount, monthlyEventLimit);
  const warningLevel = getWarningLevel(monthlyEventCount, monthlyEventLimit);
  const nextTier = getNextTier(currentTier as SubscriptionTier);

  // Color schemes for different warning levels
  const warningColors: Record<WarningLevel, { bg: string; border: string; text: string; bar: string; }> = {
    safe: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      bar: 'bg-green-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      bar: 'bg-yellow-500',
    },
    danger: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      bar: 'bg-orange-500',
    },
    exceeded: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      bar: 'bg-red-500',
    },
  };

  const colors = warningColors[warningLevel];

  // Warning messages
  const getWarningMessage = (): { icon: React.ReactNode; title: string; message: string } | null => {
    if (warningLevel === 'exceeded') {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Event Limit Reached',
        message: 'You\'ve reached your monthly limit. Upgrade now to continue tracking conversions.',
      };
    }

    if (warningLevel === 'danger') {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Approaching Limit',
        message: `You're at ${usagePercentage.toFixed(0)}% of your monthly limit. Consider upgrading to avoid interruptions.`,
      };
    }

    if (warningLevel === 'warning') {
      return {
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Usage Warning',
        message: `You've used ${usagePercentage.toFixed(0)}% of your events this month.`,
      };
    }

    return null;
  };

  const warning = getWarningMessage();
  const isUnlimited = monthlyEventLimit === -1;

  return (
    <div className="space-y-4">
      {/* Usage Card */}
      <Card className={`p-6 ${colors.bg} ${colors.border} border-2`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {tierConfig.displayName} Plan
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isUnlimited
                  ? 'Unlimited events per month'
                  : `${formatEventCount(monthlyEventLimit)} events per month`}
              </p>
            </div>
            {warningLevel !== 'safe' && (
              <div className={`${colors.text}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {!isUnlimited && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {formatEventCount(monthlyEventCount)} / {formatEventCount(monthlyEventLimit)} events used
                </span>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bar} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlimited Badge */}
          {isUnlimited && (
            <div className="flex items-center gap-2 text-purple-600">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {formatEventCount(monthlyEventCount)} events tracked this month
              </span>
            </div>
          )}

          {/* Warning Message */}
          {warning && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
              <div className={colors.text}>{warning.icon}</div>
              <div className="flex-1">
                <h4 className={`font-semibold ${colors.text}`}>{warning.title}</h4>
                <p className="text-sm text-gray-700 mt-1">{warning.message}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && nextTier && (warningLevel === 'danger' || warningLevel === 'exceeded') && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade to {getTierConfig(nextTier).displayName}
              </h3>
              <p className="text-sm text-gray-700 mt-2">
                Get {formatEventCount(getTierConfig(nextTier).eventLimit)} events per month
                {getTierConfig(nextTier).eventLimit === -1 && ' (unlimited)'}
              </p>
              <ul className="mt-3 space-y-2">
                {getTierConfig(nextTier).features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${getTierConfig(nextTier).price}
              </div>
              <div className="text-sm text-gray-600">per month</div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" asChild>
                <a href={`/dashboard/upgrade?tier=${nextTier}`}>
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
