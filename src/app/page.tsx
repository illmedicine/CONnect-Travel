import Link from "next/link";
import { facilities } from "@/data/facilities";
import { generalRules } from "@/data/general-rules";
import HeroCarousel from "@/components/hero-carousel";
import FacebookFeed from "@/components/facebook-feed";
import KnowledgeSection from "@/components/knowledge-section";

export default function HomePage() {
  return (
    <>
      {/* ── Hero Carousel ──────────────────────────────────── */}
      <HeroCarousel />

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-dark">
            How It Works
          </h2>
          <p className="mt-3 text-center text-gray-500 max-w-2xl mx-auto">
            Three simple steps — no hassle, no confusion.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "🏛️",
                title: "Select a Facility",
                desc: "Choose from Western NY correctional facilities. We show visiting hours and rules automatically.",
              },
              {
                step: "2",
                icon: "🔍",
                title: "Look Up Your Loved One",
                desc: "Enter the inmate's name or DIN. We'll filter the calendar to only show valid visiting dates.",
              },
              {
                step: "3",
                icon: "💳",
                title: "Book & Pay",
                desc: "$50 per seat. Funds are held in escrow until the trip is confirmed by a driver.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-4 left-6 bg-accent text-primary-dark w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg text-primary-dark">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Facilities ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-dark">
            Facilities We Serve
          </h2>
          <p className="mt-3 text-center text-gray-500 max-w-xl mx-auto">
            All within a short drive from Buffalo, NY.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((f) => (
              <Link
                key={f.id}
                href={`/facilities#${f.id}`}
                className="group bg-surface rounded-xl p-6 border border-gray-100 hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {f.type.replace("-", " ")}
                  </span>
                  <span className="text-xs text-gray-400">
                    ~{f.distanceFromBuffalo} mi
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-primary-dark group-hover:text-accent transition-colors">
                  {f.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{f.location}</p>
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Visiting:</span>{" "}
                  {f.visitingHours.days}, {f.visitingHours.start} –{" "}
                  {f.visitingHours.end}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCCS Rules Bulletin ───────────────────────────── */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-dark">
            Know Before You Go
          </h2>
          <p className="mt-3 text-center text-gray-500 max-w-xl mx-auto">
            General NYS DOCCS visiting rules that apply to all facilities.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {generalRules.map((rule) => (
              <div
                key={rule.title}
                className="bg-white rounded-xl p-6 border border-gray-100"
              >
                <div className="text-3xl mb-3">{rule.icon}</div>
                <h3 className="font-bold text-primary-dark">{rule.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Driver CTA ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Earn Up to <span className="text-accent">$540 per Trip</span>
          </h2>
          <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
            Got a 12-passenger van? Fill every seat at $50 each. We take a 10%
            network fee — you keep the rest. Set your own schedule and choose
            your routes.
          </p>
          <Link
            href="/driver"
            className="mt-8 inline-flex items-center justify-center bg-accent hover:bg-accent-light text-primary-dark font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            Start Driving Today
          </Link>
        </div>
      </section>

      {/* ── Escrow Trust Section ───────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-dark">
              Your Money Is Protected
            </h2>
            <p className="mt-4 text-gray-600">
              Every payment is held in <strong>smart escrow</strong> until trip
              conditions are met. If no driver accepts your pool within 12 hours
              of departure, you get a <strong>100% automatic refund</strong>.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: "🔒",
                title: "Funds Held Securely",
                desc: "Your $50 deposit is held in escrow — never goes directly to the driver until the trip is confirmed.",
              },
              {
                icon: "⏰",
                title: "24-Hour Pay Window",
                desc: "Deposit must be paid within 24 hours of booking or the request auto-cancels.",
              },
              {
                icon: "💸",
                title: "Auto-Refund Guarantee",
                desc: "No driver by T-minus 12 hours? 100% refund, automatically. No questions asked.",
              },
            ].map((item) => (
              <div key={item.title} className="p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-primary-dark">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Knowledge Center ──────────────────────────────── */}
      <KnowledgeSection />

      {/* ── Facebook Feed ──────────────────────────────────── */}
      <FacebookFeed />
    </>
  );
}
