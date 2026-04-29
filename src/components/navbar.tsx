"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Keep in sync with `basePath` in next.config.ts (GitHub Pages prefix).
const LOGO_SRC = "/CONnect-Travel/logo.png";
const FACEBOOK_URL =
  "https://www.facebook.com/people/ConNetwork-Travel-NY/61589079325758/";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="ConNetwork Travel — Home">
            <Image
              src={LOGO_SRC}
              alt="ConNetwork Travel"
              width={617}
              height={96}
              priority
              className="h-12 md:h-14 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <Link
              href="/book"
              className="hover:text-accent transition-colors"
            >
              Book a Ride
            </Link>
            <Link
              href="/facilities"
              className="hover:text-accent transition-colors"
            >
              Facilities
            </Link>
            <Link
              href="/#knowledge"
              className="hover:text-accent transition-colors"
            >
              Knowledge
            </Link>
            <Link
              href="/driver"
              className="hover:text-accent transition-colors"
            >
              Drive With Us
            </Link>
            <Link
              href="/driversportal"
              className="hover:text-accent transition-colors"
            >
              Drivers Portal
            </Link>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#0f63cf] text-white px-3 py-2 rounded-lg font-semibold transition-colors"
              aria-label="Follow ConNetwork Travel on Facebook (opens in new tab)"
            >
              <FacebookIcon className="w-4 h-4" />
              <span>Follow</span>
            </a>
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-light text-primary-dark px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-primary-light px-4 pb-4 space-y-2">
          <Link
            href="/"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/book"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Book a Ride
          </Link>
          <Link
            href="/facilities"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Facilities
          </Link>
          <Link
            href="/#knowledge"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Knowledge
          </Link>
          <Link
            href="/driver"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Drive With Us
          </Link>
          <Link
            href="/driversportal"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Drivers Portal
          </Link>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 text-[#4ea3ff] font-semibold"
            onClick={() => setMenuOpen(false)}
          >
            <FacebookIcon className="w-4 h-4" />
            <span>Follow on Facebook</span>
          </a>
          <Link
            href="/login"
            className="block py-2 text-accent font-semibold"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        </nav>
      )}
    </header>
  );
}
