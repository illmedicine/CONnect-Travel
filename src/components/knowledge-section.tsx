"use client";

import { useState } from "react";

type TabId = "family" | "admin";

const TABS: Array<{ id: TabId; label: string; subtitle: string }> = [
  {
    id: "family",
    label: "For Families",
    subtitle: "Visiting Families, Friends, and Loved Ones",
  },
  {
    id: "admin",
    label: "For Facility Administration",
    subtitle: "Prison Administration Staff & DOCCS Facility Management",
  },
];

export default function KnowledgeSection() {
  const [tab, setTab] = useState<TabId>("family");

  return (
    <section
      id="knowledge"
      className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Knowledge Center
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-primary-dark">
            How Connect Travel works — and why facilities can trust us
          </h2>
          <p className="mt-3 text-gray-600">
            Two short briefings: one for visiting families and one for prison
            administration. Read below or download the full PDF-ready memos.
          </p>
        </div>

        {/* Tab strip */}
        <div
          role="tablist"
          aria-label="Knowledge documents"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-primary text-white shadow"
                  : "bg-white text-primary-dark border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "family" ? <FamilyPanel /> : <AdminPanel />}
        </div>
      </div>
    </section>
  );
}

// ── Family memo ────────────────────────────────────────────────────────

function FamilyPanel() {
  return (
    <div
      role="tabpanel"
      id="panel-family"
      aria-labelledby="tab-family"
      className="grid lg:grid-cols-3 gap-6"
    >
      <article className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
        <header className="border-b border-gray-100 pb-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Community Memorandum
          </p>
          <h3 className="mt-1 text-xl md:text-2xl font-bold text-primary-dark">
            Affordable Transportation to Visitation Facilities
          </h3>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
            <div>
              <dt className="font-semibold text-gray-500">To</dt>
              <dd>Visiting families & friends across WNY</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">From</dt>
              <dd>The Connect Travel Network</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">Subject</dt>
              <dd>Affordable rides to NYS DOCCS facilities</dd>
            </div>
          </dl>
        </header>

        <div className="prose prose-sm max-w-none mt-5 text-gray-700">
          <p>
            Having a loved one in a correctional facility is difficult enough
            without the added stress and high cost of transportation.
          </p>
          <p>
            Connect Travel was built to solve this problem. We are a secure,
            peer-to-peer ride-sharing platform that pairs local,
            background-verified community drivers with families traveling to
            New York State DOCCS facilities. By pooling passengers together
            into larger vehicles, we are able to reduce the cost of travel to
            approximately <strong>$50 per rider</strong>.
          </p>
        </div>

        <h4 className="mt-6 font-semibold text-primary-dark">
          How the program works
        </h4>
        <ol className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              n: 1,
              t: "Join the community",
              d: "Follow the Connect Travel Facebook community to see active trips, drivers, and announcements.",
            },
            {
              n: 2,
              t: "Open the homepage",
              d: "Visit the Connect Travel homepage on any phone or computer.",
            },
            {
              n: 3,
              t: "Pick your facility & date",
              d: "Our scheduler enforces each facility's exact visiting days and DOCCS rules.",
            },
            {
              n: 4,
              t: "Reserve with a $50 deposit",
              d: "Funds are held in escrow — never sent directly to the driver until your trip is confirmed.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-xs font-bold">
                  {s.n}
                </span>
                <p className="font-semibold text-primary-dark">{s.t}</p>
              </div>
              <p className="mt-2 text-gray-600">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href="/CONnect-Travel/Memo.docx"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            Download family memo (.docx)
          </a>
          <a
            href="https://www.facebook.com/people/ConNetwork-Travel-NY/61589079325758/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#0f63cf] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Follow on Facebook
          </a>
        </div>
      </article>

      <aside className="space-y-4">
        <Highlight
          title="≈ $50 per rider"
          body="Pooled vehicles cut the cost of weekend visits dramatically below private rideshare or rental cars."
          accent="emerald"
        />
        <Highlight
          title="Background-verified drivers"
          body="Every driver is locally vetted before they can pick up trips on the platform."
          accent="blue"
        />
        <Highlight
          title="Escrow-protected deposits"
          body="Your $50 never goes directly to the driver. No driver by T-12h? Automatic 100% refund."
          accent="amber"
        />
      </aside>
    </div>
  );
}

// ── Administration memo ────────────────────────────────────────────────

function AdminPanel() {
  return (
    <div
      role="tabpanel"
      id="panel-admin"
      aria-labelledby="tab-admin"
      className="grid lg:grid-cols-3 gap-6"
    >
      <article className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
        <header className="border-b border-gray-100 pb-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Administrative Disclaimer Memorandum
          </p>
          <h3 className="mt-1 text-xl md:text-2xl font-bold text-primary-dark">
            Ride-Share Operations, Liability Coverage, and Facility Policy
            Adherence
          </h3>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <dt className="font-semibold text-gray-500">Entity</dt>
              <dd>Connect Travel LLC</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-500">Attn</dt>
              <dd>Prison Administration & DOCCS Facility Management</dd>
            </div>
          </dl>
        </header>

        <p className="mt-5 text-sm text-gray-700">
          The purpose of this document is to introduce the Connect Travel
          community ride-share platform, outline our strict operational
          guidelines, and provide absolute assurances regarding our liability
          coverage and adherence to facility protocols.
        </p>

        <div className="mt-6 space-y-4">
          <PolicySection
            n={1}
            title="Comprehensive liability and insurance coverage"
          >
            <p>
              Connect Travel maintains active{" "}
              <strong>$1,000,000 per-incident Commercial General Liability</strong>{" "}
              coverage, alongside comprehensive Personal, Bodily Injury, and
              Courier Insurance. Coverage extends to all passengers and drivers
              actively using the platform for transit to and from your
              facility.
            </p>
            <p className="mt-2">
              We formally hold the correctional facility, its administration,
              and the state entirely harmless for any events, injuries, or
              liabilities occurring during passenger transit or on facility
              grounds.
            </p>
          </PolicySection>

          <PolicySection
            n={2}
            title="Strict adherence to DOCCS directives & facility visitation policies"
          >
            <p>
              Our booking logic is directly mapped to NYS DOCCS Directives and
              each facility&apos;s individual schedule — including alternating
              weekend rotations based on inmate <strong>DIN</strong> or last
              name. Riders cannot book on incorrect days.
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                Valid, unexpired government-issued photo ID required for every
                visitor.
              </li>
              <li>
                Maximum visitor capacity enforced (e.g., 3 adults + 1 child
                under 5).
              </li>
              <li>
                Zero-tolerance contraband protocols, dress codes, and
                metal-detector / Cell Sense screening.
              </li>
              <li>
                Facility-specific package drop-off and secure-vendor rules.
              </li>
            </ul>
          </PolicySection>

          <PolicySection
            n={3}
            title="Overcrowding protocols & driver conduct standards"
          >
            <p>
              Drivers are strictly logistical transport providers. They drop
              passengers at designated processing areas and remain in their
              vehicles or stage off-site. Drivers will <em>not</em> attempt to
              enter the facility or visitation room unless they are
              personally an approved, registered visitor for an inmate.
            </p>
            <p className="mt-2">
              Drivers are educated on DOCCS overcrowding protocols: when the
              visitation room reaches capacity, visitors traveling from within
              a 100-mile radius may have visits terminated after three (3)
              hours. Drivers schedule turnarounds accordingly to avoid
              disruption.
            </p>
          </PolicySection>

          <PolicySection n={4} title="Facility independence">
            <p>
              Connect Travel is a privately operated, independent LLC
              registered in Florida and operating out of Buffalo, New York. We
              make <strong>no claims</strong> of official affiliation,
              partnership, or endorsement by the Department of Corrections or
              any specific facility. Our sole objective is to provide a safe,
              insured, compliant, and affordable logistical solution for
              families exercising visitation privileges.
            </p>
          </PolicySection>
        </div>

        <footer className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <p className="font-semibold text-primary-dark">DeMarkus Wilson</p>
          <p>Founder &amp; Director, Connect Travel — Buffalo, New York</p>
          <p className="mt-2">
            Connect Travel is a registered trademark product of{" "}
            <a
              href="https://www.illyrobotic-ai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Illy Robotic Instruments LLC
            </a>{" "}
            · Mobile: (718) 709-1364
          </p>
        </footer>

        <div className="mt-6">
          <a
            href="/CONnect-Travel/Admin%20Disclaimer%20Memo.docx"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            Download admin memo (.docx)
          </a>
        </div>
      </article>

      <aside className="space-y-4">
        <Highlight
          title="$1M CGL coverage"
          body="Per-incident commercial general liability plus personal, bodily-injury, and courier coverage."
          accent="emerald"
        />
        <Highlight
          title="Facility held harmless"
          body="We formally release the facility, its staff, and the state from liability for transit-related events."
          accent="blue"
        />
        <Highlight
          title="DOCCS-aware scheduler"
          body="Visiting days, DIN/last-name rotations, and capacity rules are coded directly into the booking flow."
          accent="amber"
        />
        <Highlight
          title="No facility affiliation claimed"
          body="Connect Travel operates independently and never represents itself as a partner of DOCCS."
          accent="slate"
        />
      </aside>
    </div>
  );
}

// ── Building blocks ────────────────────────────────────────────────────

function PolicySection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-gray-50 open:bg-white open:shadow-sm">
      <summary className="cursor-pointer list-none p-4 flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-xs font-bold">
          {n}
        </span>
        <span className="flex-1 font-semibold text-primary-dark">
          {title}
        </span>
        <svg
          className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pl-14 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

const ACCENT_CLASSES: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
};

function Highlight({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  return (
    <div className={`rounded-xl border p-4 ${ACCENT_CLASSES[accent]}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{body}</p>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
      />
    </svg>
  );
}
