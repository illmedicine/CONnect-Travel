"use client";

/**
 * Lightweight client-side Google Sign-In helper for the Drivers Portal.
 *
 * IMPORTANT — production hardening:
 * The ID token issued by Google is *only* trustworthy when verified on a
 * server (Google's tokeninfo endpoint or a JWKS-aware library). Until a
 * backend is wired up, this module decodes the JWT client-side purely for
 * UX (showing the driver's name/photo). Authorization (whether the email
 * is on the registered-driver allowlist) MUST be re-checked server-side
 * before any trip data is exposed in the real product.
 */

export interface DriverIdentity {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  iat: number;
  exp: number;
}

const STORAGE_KEY = "ctnyc.driver.identity.v1";

/** Replace with the OAuth Web Client ID from Google Cloud Console. */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  // Project: connect-travel-494912 (Web client)
  "1032082418409-p3gahqlfvpua2th2nk5tabg9e907qfrg.apps.googleusercontent.com";

/**
 * Allowlist of driver emails. In production this lives in the database
 * and is checked server-side. Keep this list in sync with the dispatch
 * roster until the backend is up.
 */
export const REGISTERED_DRIVER_EMAILS: readonly string[] = [
  "dispatch@connetworktravel.com",
  // Add registered driver Gmail addresses here.
];

function decodeJwtPayload<T = unknown>(jwt: string): T | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function parseCredential(idToken: string): DriverIdentity | null {
  const payload = decodeJwtPayload<DriverIdentity & { email_verified?: boolean }>(
    idToken,
  );
  if (!payload || !payload.email || !payload.sub) return null;
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
}

export function isRegisteredDriver(email: string | undefined): boolean {
  if (!email) return false;
  // Demo mode: any @connetworktravel.com email or anything on the allowlist.
  if (email.toLowerCase().endsWith("@connetworktravel.com")) return true;
  return REGISTERED_DRIVER_EMAILS.includes(email.toLowerCase());
}

export function loadIdentity(): DriverIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DriverIdentity;
    if (parsed.exp * 1000 < Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: DriverIdentity): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
