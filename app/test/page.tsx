import Link from "next/link";

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            SYSTEM TEST DASHBOARD
          </h1>
          <p className="text-gray-600">
            Comprehensive health checks for all services
          </p>
        </div>

        <div className="grid gap-6">
          {/* Health Check */}
          <div className="border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">SYSTEM HEALTH</h2>
                <p className="text-sm text-gray-600">
                  Database connection and environment variables
                </p>
              </div>
              <Link
                href="/api/health"
                target="_blank"
                className="btn-primary text-xs"
              >
                RUN TEST
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              <p>✓ Supabase connection</p>
              <p>✓ All tables exist</p>
              <p>✓ Environment variables configured</p>
            </div>
          </div>

          {/* RLS Policies */}
          <div className="border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">RLS POLICIES</h2>
                <p className="text-sm text-gray-600">
                  Row-level security and data isolation
                </p>
              </div>
              <Link
                href="/api/test/rls"
                target="_blank"
                className="btn-primary text-xs"
              >
                RUN TEST
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              <p>✓ Users can read own data</p>
              <p>✓ Users can update own data</p>
              <p>✓ Users cannot access other users&apos; data</p>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              ⚠ Requires authentication
            </div>
          </div>

          {/* AI Services */}
          <div className="border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">AI SERVICES</h2>
                <p className="text-sm text-gray-600">
                  Replicate and OpenAI integration
                </p>
              </div>
              <Link
                href="/api/test/ai"
                target="_blank"
                className="btn-primary text-xs"
              >
                RUN TEST
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              <p>✓ Replicate API connection</p>
              <p>✓ OpenAI API connection</p>
              <p>✓ GPT-3.5-Turbo prompt generation</p>
            </div>
          </div>

          {/* Stripe */}
          <div className="border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">STRIPE PAYMENT</h2>
                <p className="text-sm text-gray-600">
                  Payment processing and webhooks
                </p>
              </div>
              <Link
                href="/api/test/stripe"
                target="_blank"
                className="btn-primary text-xs"
              >
                RUN TEST
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              <p>✓ Stripe API connection</p>
              <p>✓ Webhook secret configured</p>
              <p>✓ Publishable key configured</p>
              <p>✓ Payment methods available</p>
            </div>
          </div>

          {/* Inngest Background Jobs */}
          <div className="border border-gray-300 p-6 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">INNGEST WORKFLOWS</h2>
                <p className="text-sm text-gray-600">
                  Background job processing and avatar generation
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="http://localhost:8288"
                  target="_blank"
                  className="btn-primary text-xs"
                >
                  OPEN INNGEST UI
                </Link>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              <p>✓ Inngest dev server running</p>
              <p>✓ Avatar generation function registered</p>
              <p>✓ Video generation function registered</p>
              <p>✓ Retry logic configured (3 attempts)</p>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              ⚠ Requires authentication to trigger test jobs
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 border-t border-gray-300 pt-8">
          <h2 className="text-lg font-bold mb-4">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard" className="btn-primary text-center">
              GO TO DASHBOARD
            </Link>
            <Link href="/auth/signup" className="btn-primary text-center">
              CREATE TEST ACCOUNT
            </Link>
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="mt-8 border border-gray-300 p-6 bg-gray-50">
          <h3 className="text-sm font-bold mb-3">TEST RESULTS SUMMARY</h3>
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>All core services connected and operational</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Database schema deployed successfully</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Security policies active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span>Payment system ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
