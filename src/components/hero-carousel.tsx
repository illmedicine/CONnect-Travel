"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
};

// Slides map to files in /public/hero/. Order = display order.
const SLIDES: Slide[] = [
  {
    src: "/hero/Buscommunityphoto.png",
    alt: "Community gathered around a CONnect Travel van",
    eyebrow: "Community First",
    title: (
      <>
        Connecting Families,
        <br />
        <span className="text-accent">One Ride at a Time</span>
      </>
    ),
    subtitle:
      "Affordable, shared rides from Buffalo to Western NY correctional facilities — book a seat in minutes.",
  },
  {
    src: "/hero/drivertablet.png",
    alt: "Driver reviewing the CONnect Travel trip board on a tablet",
    eyebrow: "For Drivers",
    title: (
      <>
        Fill Every Seat.
        <br />
        <span className="text-accent">Drive on Your Schedule.</span>
      </>
    ),
    subtitle:
      "See open trips, accept rides, and manage your van — all from one tablet-friendly dashboard.",
  },
  {
    src: "/hero/ElderlyPickup.png",
    alt: "Driver helping an elderly passenger board the van",
    eyebrow: "Door-to-Gate Care",
    title: (
      <>
        Friendly Pickup.
        <br />
        <span className="text-accent">Every Visit.</span>
      </>
    ),
    subtitle:
      "Verified drivers help every passenger — from grandparents to young families — get to the gate safely.",
  },
  {
    src: "/hero/busstopdrivers.png",
    alt: "CONnect Travel drivers ready at the pickup stop",
    eyebrow: "Verified Drivers",
    title: (
      <>
        Trusted People.
        <br />
        <span className="text-accent">Protected Payments.</span>
      </>
    ),
    subtitle:
      "Every $50 seat is held in smart escrow until your trip is confirmed — 100% refund if no driver accepts.",
  },
  {
    src: "/hero/ConNetworkQRTIX.png",
    alt: "CONnect Travel digital ticket with QR code",
    eyebrow: "Paperless Boarding",
    title: (
      <>
        Scan, Board,
        <br />
        <span className="text-accent">Reconnect.</span>
      </>
    ),
    subtitle:
      "Get a QR ticket the moment you book — no paperwork, no hassle, just hop on and ride.",
  },
];

const ROTATE_MS = 6000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const current = SLIDES[index];

  return (
    <section
      className="relative bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white overflow-hidden"
      aria-roledescription="carousel"
      aria-label="CONnect Travel highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Slides (background images, cross-fade) */}
      <div className="absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary-dark/65 to-primary-dark/30" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-bold tracking-widest uppercase bg-accent/90 text-primary-dark px-3 py-1 rounded-full">
            {current.eyebrow}
          </span>
          <h1
            key={`title-${index}`}
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-md animate-[fadeIn_700ms_ease-out]"
          >
            {current.title}
          </h1>
          <p
            key={`sub-${index}`}
            className="mt-6 text-lg md:text-xl text-gray-100 max-w-2xl drop-shadow animate-[fadeIn_900ms_ease-out]"
          >
            {current.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/book"
              className="inline-flex items-center justify-center bg-accent hover:bg-accent-light text-primary-dark font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Book a Ride — $50 per seat
            </Link>
            <Link
              href="/driver"
              className="inline-flex items-center justify-center border-2 border-white/40 hover:border-accent hover:bg-white/5 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors backdrop-blur-sm"
            >
              Become a Driver
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous slide"
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 transition-colors"
      >
        <span aria-hidden className="text-2xl leading-none">‹</span>
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next slide"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 transition-colors"
      >
        <span aria-hidden className="text-2xl leading-none">›</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-16 left-0 right-0 z-10 flex justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none">
        <svg viewBox="0 0 1440 60" className="w-full h-12 text-surface fill-current">
          <path d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}
