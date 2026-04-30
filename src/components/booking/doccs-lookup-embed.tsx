"use client";

/**
 * DOCCS Incarcerated Lookup — embedded experience.
 *
 * NY State's official lookup at https://nysdoccslookup.doccs.ny.gov/ sets
 * X-Frame-Options to block direct iframe embedding (clickjacking
 * protection). This component:
 *
 *   1. Attempts the iframe first (in case the policy ever changes).
 *   2. If the iframe is empty after a short timeout, swaps to a docked
 *      side-panel UI that opens the official lookup as a controlled popup
 *      window with the user's DIN pre-copied to clipboard.
 *
 * No scraping. No proxy. The official DOCCS page is always the source of
 * truth — we just shorten the click path.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  prefilledDIN?: string;
  onClose?: () => void;
}

const DOCCS_URL = "https://nysdoccslookup.doccs.ny.gov/";

export function DoccsLookupEmbed({ prefilledDIN, onClose }: Props) {
  const [iframeBlocked, setIframeBlocked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Detect frame-blocking. We can't read cross-origin window.location, but
  // a blocked iframe never fires `load`. After 3.5s of silence we assume
  // it was rejected by X-Frame-Options / CSP and switch to fallback UI.
  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      if (iframeBlocked === null) setIframeBlocked(true);
    }, 3500);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [iframeBlocked]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setIframeBlocked(false);
  };

  const copyDIN = async () => {
    if (!prefilledDIN) return;
    try {
      await navigator.clipboard.writeText(prefilledDIN);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard may be blocked in some contexts
    }
  };

  const openPanel = () => {
    if (prefilledDIN) void copyDIN();
    const w = 520;
    const h = Math.min(820, window.innerHeight - 40);
    const left = window.screenX + window.outerWidth - w - 20;
    const top = window.screenY + 60;
    window.open(
      DOCCS_URL,
      "doccs-lookup",
      `width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`,
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between bg-primary-dark text-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-semibold uppercase tracking-wider">
            Official
          </span>
          <span className="text-sm font-semibold">NYS DOCCS Incarcerated Lookup</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg leading-none"
            aria-label="Close lookup"
          >
            ×
          </button>
        )}
      </div>

      {iframeBlocked === null && (
        <div className="aspect-[4/5] bg-gray-50 grid place-items-center text-sm text-gray-500">
          Connecting to DOCCS…
        </div>
      )}

      {iframeBlocked === false && (
        <iframe
          ref={iframeRef}
          src={DOCCS_URL}
          title="NYS DOCCS Incarcerated Lookup"
          className="w-full aspect-[4/5] border-0"
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      )}

      {/* Hidden probe iframe so we can keep the visible UI clean while
         attempting the load. */}
      {iframeBlocked === null && (
        <iframe
          src={DOCCS_URL}
          title="DOCCS lookup probe"
          onLoad={handleIframeLoad}
          className="hidden"
        />
      )}

      {iframeBlocked && (
        <div className="p-5 space-y-4 bg-surface">
          <div>
            <p className="text-sm text-gray-700">
              The state of New York blocks embedding of the DOCCS lookup for
              security. Open it as a docked panel — your DIN will be copied to
              your clipboard so you can paste it directly into the search box.
            </p>
          </div>

          {prefilledDIN && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500">
                  Your DIN
                </p>
                <p className="text-sm font-mono font-semibold text-primary-dark">
                  {prefilledDIN}
                </p>
              </div>
              <button
                onClick={copyDIN}
                className="text-xs font-semibold text-primary hover:text-primary-dark"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}

          <button
            onClick={openPanel}
            className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Open DOCCS Lookup Panel ↗
          </button>

          <p className="text-[11px] text-gray-500 text-center">
            A small window will open beside this page. Close it when done — your
            booking progress here is preserved.
          </p>
        </div>
      )}
    </div>
  );
}
