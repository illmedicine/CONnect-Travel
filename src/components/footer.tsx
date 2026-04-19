import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-white font-bold text-lg">
              Con<span className="text-accent">Network</span> Travel
            </span>
            <p className="mt-2 text-sm text-gray-400">
              Connecting families, one ride at a time. Affordable shared
              transport from Buffalo to Western NY correctional facilities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/book" className="hover:text-accent transition-colors">
                  Book a Ride
                </Link>
              </li>
              <li>
                <Link href="/facilities" className="hover:text-accent transition-colors">
                  Facility Info
                </Link>
              </li>
              <li>
                <Link href="/driver" className="hover:text-accent transition-colors">
                  Become a Driver
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-accent transition-colors">
                  Visiting Rules
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-3">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://facebook.com/groups/connecttravel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Facebook Group
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-primary/50 rounded-lg text-xs">
              <p className="text-accent font-semibold">💡 Tip</p>
              <p className="mt-1">
                Join our Facebook Group to coordinate pickup spots in Buffalo
                and get real-time prison wait-time updates from fellow visitors.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-center text-gray-500">
          &copy; {new Date().getFullYear()} Connect Travel. All rights reserved.
          <span className="block mt-1">Buffalo, NY — Serving Western NY families</span>
        </div>
      </div>
    </footer>
  );
}
