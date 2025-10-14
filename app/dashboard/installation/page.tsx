'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export default function InstallationPage() {
  const [copied, setCopied] = useState(false);

  // In real app, get merchant ID from session
  const merchantId = 'your-merchant-id';

  const installScript = `<!-- PixelFlow Tracking Script -->
<script>
  window.PIXELFLOW_MERCHANT_ID = '${merchantId}';
  window.PIXELFLOW_API_URL = 'https://pixelflow.app/api/track';
</script>
<script src="https://pixelflow.app/pixel-script.js" async></script>
<!-- End PixelFlow Script -->`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Installation</h1>
        <p className="text-gray-600 mt-1">
          Install the PixelFlow tracking script on your website
        </p>
      </div>

      {/* Installation Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Installation Steps</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Copy the tracking script below</li>
          <li>Paste it in the <code className="bg-gray-100 px-2 py-1 rounded">&lt;head&gt;</code> section of your website</li>
          <li>Deploy your changes</li>
          <li>Events will start appearing in your dashboard automatically</li>
        </ol>
      </Card>

      {/* Tracking Script */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Tracking Script</h2>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>

        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{installScript}</code>
        </pre>
      </Card>

      {/* Advanced Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Track Custom Events</h2>
        <p className="text-gray-700 mb-4">
          Once installed, you can track custom events using the global <code className="bg-gray-100 px-2 py-1 rounded">pixelFlow</code> object:
        </p>

        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`// Track a purchase
pixelFlow.track('Purchase', {
  value: 49.99,
  currency: 'USD',
  orderId: 'order_123',
  contentIds: ['product_1', 'product_2']
});

// Track an add to cart
pixelFlow.track('AddToCart', {
  value: 29.99,
  currency: 'USD',
  contentIds: ['product_1']
});

// Track a custom event
pixelFlow.track('StartTrial', {
  email: 'user@example.com',
  userId: 'user_123'
});`}</code>
        </pre>
      </Card>

      {/* Verification */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-2">Verify Installation</h2>
        <p className="text-gray-700">
          After installing the script, visit your website and check the Events page in this dashboard.
          You should see PageView events appearing within seconds.
        </p>
        <Button className="mt-4" asChild>
          <a href="/dashboard/events">View Events</a>
        </Button>
      </Card>
    </div>
  );
}
