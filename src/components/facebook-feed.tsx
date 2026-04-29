"use client";

/**
 * Embeds the official Facebook Page Plugin for ConNetwork Travel NY.
 * Uses Meta's iframe-based plugin so no API key, OAuth, or scraping is
 * required — Facebook serves the timeline, follower count, and cover photo
 * directly. https://developers.facebook.com/docs/plugins/page-plugin
 */

import { useEffect, useState } from "react";

const PAGE_URL = "https://www.facebook.com/people/ConNetwork-Travel-NY/61589079325758/";

function buildPluginSrc(width: number) {
  // Cap width to plugin maximum (500px) per Meta spec; height capped at 700.
  const w = Math.min(Math.max(width, 280), 500);
  const params = new URLSearchParams({
    href: PAGE_URL,
    tabs: "timeline",
    width: String(w),
    height: "700",
    small_header: "false",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "true",
    appId: "",
  });
  return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
}

export default function FacebookFeed() {
  const [width, setWidth] = useState(500);

  useEffect(() => {
    const update = () => {
      // Match the column width on small screens; cap at 500 (plugin max).
      const target = Math.min(window.innerWidth - 48, 500);
      setWidth(target);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">
            Community
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-primary-dark">
            Latest from Facebook
          </h2>
          <p className="mt-3 text-gray-500">
            Trip announcements, route updates, and community stories straight
            from our official ConNetwork Travel NY page.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Quick stats / CTA column */}
          <div className="lg:col-span-1 space-y-4">
            <a
              href={PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-primary text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <FacebookGlyph className="w-9 h-9 text-accent" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/70">
                    Follow us on
                  </div>
                  <div className="font-bold text-lg">ConNetwork Travel NY</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/80">
                Get real-time alerts when new weekday and weekend trips open
                up, plus driver spotlights and visitor tips.
              </p>
              <span className="mt-5 inline-flex items-center justify-center bg-accent hover:bg-accent-light text-primary-dark font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Open Page →
              </span>
            </a>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-primary-dark text-sm">
                What you&apos;ll see
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-accent">▸</span>
                  Live timeline of every public post
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">▸</span>
                  Page follower count and likes
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">▸</span>
                  Photos from drivers and families
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">▸</span>
                  Trip announcements before they fill
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-primary-dark text-sm">
                Want a private group?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Drivers and frequent visitors can join our private Facebook
                group for route coordination and pickups.
              </p>
              <a
                href="https://facebook.com/groups/connecttravel"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:text-primary-light"
              >
                Request to join →
              </a>
            </div>
          </div>

          {/* Page Plugin (timeline + cover + facepile) */}
          <div className="lg:col-span-2 flex justify-center">
            <div
              className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm overflow-hidden"
              style={{ width: width + 24 }}
            >
              <iframe
                key={width}
                title="ConNetwork Travel NY — Facebook Page"
                src={buildPluginSrc(width)}
                width={width}
                height={700}
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder={0}
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Posts and stats are loaded directly from Facebook. If the feed
          doesn&apos;t appear, your browser or an extension may be blocking
          third-party content from facebook.com.
        </p>
      </div>
    </section>
  );
}

function FacebookGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}
