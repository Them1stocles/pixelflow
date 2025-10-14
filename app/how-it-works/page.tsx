import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Target,
  Users,
  TrendingUp,
  Zap,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Your Marketing Is Invisible Without Pixels
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Every viral video, every ad, every post... if you cannot track it, you cannot scale
              it. Here&apos;s why pixels are your secret weapon.
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Tracking Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
      </div>

      {/* The Problem Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The Hard Truth About Marketing in 2025
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You&apos;re dropping fire content across TikTok, Instagram, Twitter... but you have{' '}
            <span className="font-bold text-red-600">no idea what&apos;s actually working</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 border-2 border-red-200 bg-red-50">
            <div className="text-red-600 mb-4">
              <Target className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">You&apos;re Flying Blind</h3>
            <p className="text-gray-700">
              That video got 100K views? Cool. But how many actually signed up? You don&apos;t know
              because you can&apos;t see the conversion path.
            </p>
          </Card>

          <Card className="p-6 border-2 border-red-200 bg-red-50">
            <div className="text-red-600 mb-4">
              <TrendingUp className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Ad Platforms Hate You</h3>
            <p className="text-gray-700">
              Facebook and TikTok can only see 30-40% of your sales without proper tracking.
              You&apos;re basically teaching their algorithm with bad data.
            </p>
          </Card>

          <Card className="p-6 border-2 border-red-200 bg-red-50">
            <div className="text-red-600 mb-4">
              <Users className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Money Down the Drain</h3>
            <p className="text-gray-700">
              Showing ads to people who already bought? Wasting budget on content that
              doesn&apos;t convert? That&apos;s what happens without pixels.
            </p>
          </Card>
        </div>
      </div>

      {/* What Pixels Do Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Pixels Actually Do (It&apos;s Wild)
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Think of pixels as your personal spy network that tells you EXACTLY who&apos;s doing
              what on your site
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Track Every Action</h3>
                  <p className="text-blue-100">
                    Page views, button clicks, sign-ups, purchases — you see everything. No more
                    guessing which content actually converts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bypass Ad Blockers</h3>
                  <p className="text-blue-100">
                    Server-side tracking means you catch 99%+ of conversions, even when users have
                    blockers. Your competition is missing 60% of their data.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Build Lookalike Audiences</h3>
                  <p className="text-blue-100">
                    Feed pixel data to Facebook/TikTok and they&apos;ll find thousands of people
                    just like your best customers. This is how you scale from $1K/mo to $100K/mo.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Retarget Like a Pro</h3>
                  <p className="text-blue-100">
                    Show ads ONLY to people who viewed your sales page but didn&apos;t buy. Or
                    exclude existing customers from new ad campaigns. Stop wasting money.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audience Segmentation Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Audience Segmentation = Money Printer
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Once you have pixel data, you unlock god-mode targeting. Here&apos;s what the pros do:
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-2 border-green-200 bg-green-50">
            <div className="flex items-start gap-6">
              <div className="bg-green-600 text-white rounded-full p-4 text-2xl font-bold">1</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">The Hot Lead Campaign</h3>
                <p className="text-gray-700 mb-4">
                  Create an audience of people who visited your sales page but didn&apos;t buy. Hit
                  them with urgency ads (&ldquo;Last chance!&rdquo;, &ldquo;50% off ends
                  tonight&rdquo;). These convert at 10-20x regular ads.
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-green-600">Pro Move:</span> Exclude anyone who
                    purchased in the last 30 days. Don&apos;t waste money on existing customers.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-6">
              <div className="bg-blue-600 text-white rounded-full p-4 text-2xl font-bold">2</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Lookalike Scaling</h3>
                <p className="text-gray-700 mb-4">
                  Take your best 100 customers and tell Facebook/TikTok &ldquo;find me more people
                  like this.&rdquo; The algorithm will target thousands of high-intent users
                  you&apos;d never find manually.
                </p>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-blue-600">Real Talk:</span> This is how
                    7-figure creators scale. They&apos;re not smarter — they just use pixels
                    correctly.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-purple-200 bg-purple-50">
            <div className="flex items-start gap-6">
              <div className="bg-purple-600 text-white rounded-full p-4 text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">The Upsell Sequence</h3>
                <p className="text-gray-700 mb-4">
                  Identify customers who bought your $49 course. Show them ads for your $497
                  coaching program. You already know they trust you and have buying intent.
                </p>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-purple-600">Quick Win:</span> Create a
                    &ldquo;30-day post-purchase&rdquo; audience. These people just experienced your
                    value and are primed for more.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-6">
              <div className="bg-orange-600 text-white rounded-full p-4 text-2xl font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">The Content Attribution</h3>
                <p className="text-gray-700 mb-4">
                  See exactly which TikTok videos, Twitter threads, or Instagram posts led to
                  sales. Double down on what works, kill what doesn&apos;t. Most creators are
                  guessing — you&apos;ll know.
                </p>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-orange-600">Hidden Gem:</span> Often your
                    &ldquo;viral&rdquo; content doesn&apos;t convert. But that random thread you
                    posted? 12 sales. Data reveals truth.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Why PixelFlow Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why PixelFlow?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Because tracking pixels is complicated AF... until now
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Setup in 5 Minutes</h3>
              <p className="text-gray-400">
                Add your pixel IDs, copy one script tag. You&apos;re tracking. No developer needed.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Platform</h3>
              <p className="text-gray-400">
                Facebook, TikTok, Google Analytics — all your pixels in one place. See everything
                at once.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">99%+ Capture Rate</h3>
              <p className="text-gray-400">
                Server-side tracking catches conversions even with ad blockers. Your competition
                only sees 40%.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Start Tracking for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-gray-400 mt-4">
              Built for Whop creators. Integrated with Whop checkouts. Zero hassle.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Every Day Without Pixels is Money Left on the Table
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          While you&apos;re reading this, your competitors are building custom audiences, running
          retargeting campaigns, and scaling with lookalikes. Join them.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="text-lg px-12 py-6">
            Get Started Now — It&apos;s Free
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
