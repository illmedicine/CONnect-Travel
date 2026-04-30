"use client";

/**
 * Firebase Auth helpers for the Drivers Portal.
 *
 * Authorization is enforced server-side by Firestore Security Rules
 * checking membership in `/drivers/{uid}`. This module is purely a
 * client-side helper; the rules are the source of truth.
 */

import {
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  getFirebaseAuth,
  getFirestoreDb,
  googleProvider,
} from "@/lib/firebase";

export interface DriverIdentity {
  uid: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
}

/**
 * Fallback allowlist used while the Firestore `/drivers/{uid}` roster
 * is being populated. The authoritative source is Firestore.
 */
export const REGISTERED_DRIVER_EMAILS: readonly string[] = [
  "dispatch@connetworktravel.com",
];

function userToIdentity(user: User): DriverIdentity {
  return {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? user.email ?? "Driver",
    picture: user.photoURL ?? undefined,
    given_name: (user.displayName ?? "").split(" ")[0] || undefined,
  };
}

export async function signInWithGoogle(): Promise<DriverIdentity | null> {
  const auth = getFirebaseAuth();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return userToIdentity(result.user);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function signOutDriver(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

export function onIdentityChange(
  cb: (identity: DriverIdentity | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    cb(user ? userToIdentity(user) : null);
  });
}

function isLegacyAllowlisted(email: string | undefined): boolean {
  if (!email) return false;
  if (email.toLowerCase().endsWith("@connetworktravel.com")) return true;
  return REGISTERED_DRIVER_EMAILS.includes(email.toLowerCase());
}

/**
 * Server-truth driver authorization. Reads `/drivers/{uid}` and returns
 * true if the doc exists and `active !== false`. Falls back to the
 * legacy email allowlist when the roster doc cannot be read.
 */
export async function isRegisteredDriver(
  identity: DriverIdentity,
): Promise<boolean> {
  const db = getFirestoreDb();
  try {
    const snap = await getDoc(doc(db, "drivers", identity.uid));
    if (snap.exists()) {
      const data = snap.data() as { active?: boolean };
      return data.active !== false;
    }
  } catch {
    // Permission denied / offline — fall through to allowlist fallback.
  }
  return isLegacyAllowlisted(identity.email);
}

/**
 * Self-register a driver record on first sign-in. Pre-approved emails
 * (dispatch domain / allowlist) are auto-activated; everyone else is
 * created with `active: false` for dispatch review.
 */
export async function ensureDriverRecord(
  identity: DriverIdentity,
): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, "drivers", identity.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(
        ref,
        {
          email: identity.email,
          name: identity.name,
          picture: identity.picture ?? null,
          lastSeenAt: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    const preApproved = isLegacyAllowlisted(identity.email);
    await setDoc(ref, {
      uid: identity.uid,
      email: identity.email,
      name: identity.name,
      picture: identity.picture ?? null,
      active: preApproved,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  } catch {
    // Rules may temporarily block writes; ignore so UI still loads.
  }
}
