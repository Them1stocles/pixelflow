import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Track Every Conversion with{' '}
            <span className="text-blue-600">PixelFlow</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Capture 99%+ of conversions with our comprehensive tracking solution.
            Server-side + browser-side tracking for Facebook, TikTok, and Google Analytics.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>

            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-lg mb-2">Multi-Platform Tracking</h3>
              <p className="text-gray-600 text-sm">
                Track conversions across Facebook, TikTok, Google Analytics, and more from a single dashboard.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-semibold text-lg mb-2">Server-Side API</h3>
              <p className="text-gray-600 text-sm">
                Bypass ad blockers with Conversions API. Capture events that browser pixels miss.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Real-Time Sync</h3>
              <p className="text-gray-600 text-sm">
                Events processed instantly with automatic retries and deduplication built-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
          <p>&copy; 2025 PixelFlow. Built for Whop merchants.</p>
        </div>
      </footer>
    </main>
  );
}
