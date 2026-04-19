import Link from "next/link";

export const metadata = {
  title: "Sign In — Connect Travel",
  description: "Sign in to Connect Travel using your Facebook account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-4xl">🚐</span>
          <h1 className="mt-4 text-2xl font-bold text-primary-dark">
            Sign in to Connect Travel
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Use your Facebook account to sign in as a passenger or driver.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Facebook SSO button */}
          <button className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* Role selection info */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-gray-100 bg-surface">
              <h3 className="font-semibold text-primary-dark text-sm">
                🧳 I&apos;m a Passenger
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Book rides to visit your loved one. See driver profiles and
                fellow passengers.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-surface">
              <h3 className="font-semibold text-primary-dark text-sm">
                🚐 I&apos;m a Driver
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Accept trips, register your vehicle, and earn up to $540 per
                run.
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-center text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
