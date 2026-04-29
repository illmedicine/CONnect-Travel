"use client";

import { useEffect, useState } from "react";
import GoogleSignInButton from "@/components/drivers-portal/google-signin";
import DriverDashboardPanel from "@/components/drivers-portal/driver-dashboard-panel";
import {
  clearIdentity,
  isRegisteredDriver,
  loadIdentity,
  type DriverIdentity,
} from "@/lib/driver-auth";

export default function DriversPortalShell() {
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIdentity(loadIdentity());
    setHydrated(true);
  }, []);

  const signOut = () => {
    clearIdentity();
    setIdentity(null);
    setAuthError(null);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading portal…</p>
      </div>
    );
  }

  if (!identity) {
    return <SignInScreen onError={setAuthError} error={authError} onSuccess={setIdentity} />;
  }

  if (!isRegisteredDriver(identity.email)) {
    return (
      <NotAuthorizedScreen identity={identity} onSignOut={signOut} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first portal header */}
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
            onClick={signOut}
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

// ── Sign-in screen ─────────────────────────────────────────────────────

function SignInScreen({
  onSuccess,
  onError,
  error,
}: {
  onSuccess: (id: DriverIdentity) => void;
  onError: (msg: string) => void;
  error: string | null;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark via-primary to-primary-light text-white">
      <div className="max-w-md mx-auto px-6 py-10 flex flex-col min-h-screen">
        <div className="text-center mt-6">
          <p className="text-xs uppercase tracking-widest text-white/70">
            ConNetwork Travel
          </p>
          <h1 className="mt-2 text-3xl font-bold">Drivers Portal</h1>
          <p className="mt-2 text-sm text-white/80">
            Pick up trips, message riders, and share live GPS once your trip
            window opens.
          </p>
        </div>

        <div className="mt-10 bg-white text-gray-800 rounded-2xl shadow-xl p-6">
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

          <div className="mt-6 flex justify-center">
            <GoogleSignInButton onSuccess={onSuccess} onError={onError} />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}
        </div>

        <div className="mt-auto text-center text-xs text-white/70 pt-10">
          <p>
            $1 one-time download · free updates · Google Play release in
            progress
          </p>
          <p className="mt-1">
            Riders can download the free passenger app to book trips and track
            their driver.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Not authorized ─────────────────────────────────────────────────────

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
          This Google account isn&apos;t on the driver roster
        </h2>
        <p className="mt-2 text-sm text-gray-600 break-all">
          You signed in as <strong>{identity.email}</strong>. Drivers Portal
          access is limited to registered drivers approved by dispatch.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <a
            href="mailto:dispatch@connetworktravel.com?subject=Driver%20portal%20access"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg"
          >
            Apply to drive
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
