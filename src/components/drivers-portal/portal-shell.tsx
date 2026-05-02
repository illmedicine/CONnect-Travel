"use client";

import { useEffect, useState } from "react";
import DriverDashboardPanel from "@/components/drivers-portal/driver-dashboard-panel";
import { DriverDashboard } from "@/components/driver/driver-dashboard";
import {
  ensureDriverRecord,
  isRegisteredDriver,
  onIdentityChange,
  signInWithGoogle,
  signOutDriver,
  type DriverIdentity,
} from "@/lib/driver-auth";

type AuthStatus = "loading" | "anonymous" | "unauthorized" | "authorized";

export default function DriversPortalShell() {
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    return onIdentityChange(async (id) => {
      if (!id) {
        setIdentity(null);
        setStatus("anonymous");
        return;
      }
      setIdentity(id);
      await ensureDriverRecord(id);
      const ok = await isRegisteredDriver(id);
      setStatus(ok ? "authorized" : "unauthorized");
    });
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setAuthError(
        code === "auth/unauthorized-domain"
          ? "This domain is not authorized in Firebase Auth. Add it under Authentication → Settings → Authorized domains."
          : `Sign-in failed${code ? ` (${code})` : ""}.`,
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutDriver();
    setAuthError(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading portal…</p>
      </div>
    );
  }

  if (status === "anonymous" || !identity) {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        signingIn={signingIn}
        error={authError}
      />
    );
  }

  if (status === "unauthorized") {
    return <NotAuthorizedScreen identity={identity} onSignOut={handleSignOut} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-primary text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {identity.picture ? (
            <img
              src={identity.picture}
              alt=""
              className="w-9 h-9 rounded-full border border-white/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 grid place-items-center text-sm font-bold">
              {identity.name?.[0] ?? "D"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Drivers Portal
            </p>
            <p className="font-semibold truncate">
              {identity.given_name ?? identity.name}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-24">
        <DriverDashboardPanel identity={identity} />
      </main>
    </div>
  );
}

function SignInScreen({
  onSignIn,
  signingIn,
  error,
}: {
  onSignIn: () => void;
  signingIn: boolean;
  error: string | null;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero / sign-in CTA */}
      <div className="bg-gradient-to-b from-primary-dark via-primary to-primary-light text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">
              ConNetwork Travel
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold">
              Drivers Portal
            </h1>
            <p className="mt-3 text-white/85 max-w-md">
              Pick up trips, message riders, and share live GPS once your trip
              window opens. Earn up to <strong>$540 per trip</strong> driving
              families to Western NY correctional facilities.
            </p>
          </div>

          <div className="bg-white text-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-primary-dark text-lg">
              Sign in with your driver Google account
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Use the email dispatch has on file. New driver?{" "}
              <a
                href="mailto:dispatch@connetworktravel.com"
                className="text-primary font-semibold underline"
              >
                Contact dispatch
              </a>
              .
            </p>

            <button
              onClick={onSignIn}
              disabled={signingIn}
              className="mt-6 w-full inline-flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-800 font-semibold py-3 rounded-full shadow-sm transition-colors"
            >
              <GoogleGlyph className="w-5 h-5" />
              {signingIn ? "Opening Google…" : "Continue with Google"}
            </button>

            {error && (
              <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Public preview of the driver dashboard (sample data) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Preview:</strong> Sample trips below are for illustration.
          Sign in with your driver Google account to see live trip requests
          from real riders.
        </div>
        <DriverDashboard />
      </div>
    </div>
  );
}

function NotAuthorizedScreen({
  identity,
  onSignOut,
}: {
  identity: DriverIdentity;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 text-center">
        <div className="text-4xl">🚧</div>
        <h2 className="mt-3 font-bold text-primary-dark text-lg">
          This Google account isn&apos;t on the active driver roster
        </h2>
        <p className="mt-2 text-sm text-gray-600 break-all">
          You signed in as <strong>{identity.email}</strong>. Your application
          has been recorded — dispatch will activate your account after review.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <a
            href="mailto:dispatch@connetworktravel.com?subject=Driver%20portal%20access"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg"
          >
            Contact dispatch
          </a>
          <button
            onClick={onSignOut}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.4 2.3-6.9 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.6 5l6 4.9c-.4.4 6.3-4.6 6.3-13.9 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
