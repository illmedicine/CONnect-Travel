"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Keep in sync with `basePath` in next.config.ts (GitHub Pages prefix).
const LOGO_SRC = "/CONnect-Travel/logo.png";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" aria-label="ConNetwork Travel — Home">
            <Image
              src={LOGO_SRC}
              alt="ConNetwork Travel"
              width={160}
              height={40}
              priority
              className="h-9 w-auto"
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
              href="/driver"
              className="hover:text-accent transition-colors"
            >
              Drive With Us
            </Link>
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
            href="/driver"
            className="block py-2 hover:text-accent"
            onClick={() => setMenuOpen(false)}
          >
            Drive With Us
          </Link>
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
