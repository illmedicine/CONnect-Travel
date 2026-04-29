"use client";

import { useEffect, useRef } from "react";
import {
  GOOGLE_CLIENT_ID,
  parseCredential,
  saveIdentity,
  type DriverIdentity,
} from "@/lib/driver-auth";

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (resp: { credential: string }) => void;
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    el: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: { id: GoogleAccountsId };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCRIPT_ID = "google-identity-services";

interface Props {
  onSuccess: (identity: DriverIdentity) => void;
  onError: (message: string) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      const gid = window.google?.accounts?.id;
      if (!gid || !buttonRef.current) return;

      try {
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            const identity = parseCredential(resp.credential);
            if (!identity) {
              onError("Could not read your Google credential. Please try again.");
              return;
            }
            saveIdentity(identity);
            onSuccess(identity);
          },
          use_fedcm_for_prompt: true,
        });
        gid.renderButton(buttonRef.current, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 280,
        });
      } catch {
        onError("Google Sign-In failed to initialize.");
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () =>
      onError(
        "Could not load Google Sign-In. Check your network or disable tracking-protection extensions.",
      );
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={buttonRef} aria-label="Sign in with Google" />
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Drivers must use the Google account on file with dispatch.
      </p>
    </div>
  );
}
