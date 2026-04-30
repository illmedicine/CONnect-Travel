"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onIdentityChange,
  signInWithGoogle,
  signOutDriver,
  type DriverIdentity,
} from "@/lib/driver-auth";

export default function LoginPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onIdentityChange(setIdentity), []);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const id = await signInWithGoogle();
      if (id) router.push("/book");
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/unauthorized-domain") {
        setError(
          "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.",
        );
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-4xl">🚐</span>
          <h1 className="mt-4 text-2xl font-bold text-primary-dark">
            Sign in to Connect Travel
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with Google to book rides and manage your visits.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {identity ? (
            <div className="text-center space-y-4">
              {identity.picture && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={identity.picture}
                  alt={identity.name}
                  className="w-16 h-16 rounded-full mx-auto"
                />
              )}
              <div>
                <p className="font-semibold text-primary-dark">{identity.name}</p>
                <p className="text-xs text-gray-500">{identity.email}</p>
              </div>
              <Link
                href="/book"
                className="block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Book a Ride
              </Link>
              <button
                onClick={() => void signOutDriver()}
                className="text-xs text-gray-500 hover:text-primary"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 rounded-xl border border-gray-300 transition-colors disabled:opacity-60"
              >
                <GoogleGlyph />
                {loading ? "Signing in…" : "Continue with Google"}
              </button>

              {error && (
                <p className="mt-3 text-xs text-red-600 text-center">{error}</p>
              )}

              <p className="mt-6 text-xs text-center text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy
                Policy.
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Are you a driver?{" "}
                  <Link
                    href="/driversportal"
                    className="text-primary font-semibold hover:underline"
                  >
                    Use the Drivers Portal →
                  </Link>
                </p>
              </div>
            </>
          )}
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

function GoogleGlyph() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
