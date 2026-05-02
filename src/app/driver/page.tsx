"use client";

import { useEffect } from "react";

// The Driver Dashboard now lives under /driversportal. This page redirects
// any old links/bookmarks to the new location. We use client-side navigation
// because the site is exported as static HTML (no server redirects).
export default function DriverRedirectPage() {
  useEffect(() => {
    // Honor the GitHub Pages basePath ("/CONnect-Travel"). Use a relative
    // hop so it works in any deployment environment.
    const target = window.location.pathname.replace(/\/driver\/?$/, "/driversportal/");
    window.location.replace(target);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-gray-500 text-sm">
      Redirecting to the Drivers Portal…
    </div>
  );
}
