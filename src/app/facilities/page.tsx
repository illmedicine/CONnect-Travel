import { facilities } from "@/data/facilities";
import { generalRules } from "@/data/general-rules";

export const metadata = {
  title: "Facility Information — Connect Travel",
  description:
    "Detailed visiting hours, rules, and DIN schedules for Western NY correctional facilities.",
};

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-primary-dark text-center">
          Facility Information
        </h1>
        <p className="mt-2 text-center text-gray-500 max-w-xl mx-auto">
          Visiting hours, rules, and directions for the correctional facilities
          we serve from Buffalo, NY.
        </p>

        {/* Facility cards */}
        <div className="mt-10 space-y-6">
          {facilities.map((f) => (
            <div
              key={f.id}
              id={f.id}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm scroll-mt-20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {f.type.replace("-", " ")} &middot; {f.county} County
                  </span>
                  <h2 className="text-xl font-bold text-primary-dark mt-1">
                    {f.name}
                  </h2>
                  <p className="text-sm text-gray-500">{f.location}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-accent/10 text-accent font-bold px-3 py-1 rounded-lg text-sm">
                    ~{f.distanceFromBuffalo} mi from Buffalo
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface rounded-xl p-4">
                  <h3 className="font-semibold text-primary-dark text-sm mb-2">
                    Visiting Hours
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Days:</strong> {f.visitingHours.days}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {f.visitingHours.start} –{" "}
                    {f.visitingHours.end}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Latest Arrival:</strong>{" "}
                    {f.visitingHours.latestArrival}
                  </p>
                </div>
                <div className="bg-surface rounded-xl p-4">
                  <h3 className="font-semibold text-primary-dark text-sm mb-2">
                    Schedule Rules
                  </h3>
                  <p className="text-sm text-gray-600">
                    {f.visitingRules.type === "open"
                      ? "Open visitation — no DIN-based restrictions."
                      : "description" in f.visitingRules
                        ? f.visitingRules.description
                        : "See facility for details."}
                  </p>
                </div>
              </div>

              {f.notes.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-primary-dark text-sm mb-2">
                    Notes
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {f.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* General rules */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-primary-dark text-center">
            General DOCCS Visiting Rules
          </h2>
          <p className="mt-2 text-center text-gray-500 max-w-lg mx-auto">
            These rules apply at all NYS correctional facilities.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generalRules.map((rule) => (
              <div
                key={rule.title}
                className="bg-white rounded-xl p-5 border border-gray-100"
              >
                <div className="text-2xl mb-2">{rule.icon}</div>
                <h3 className="font-bold text-primary-dark text-sm">
                  {rule.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
