import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Connect Travel — Connecting Families, One Ride at a Time",
  description:
    "Connect Travel connects families visiting loved ones in NYS correctional facilities with verified community drivers. Book affordable, shared rides from Buffalo to Western NY prisons.",
  keywords: [
    "prison visitation transport",
    "Buffalo NY",
    "DOCCS",
    "inmate visitation",
    "community drivers",
    "Connect Travel",
  ],
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231e3a8a'/%3E%3Cpath d='M14 38h36M22 38v-8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8M22 46h4M38 46h4' stroke='%23fbbf24' stroke-width='3' stroke-linecap='round' fill='none'/%3E%3Ccircle cx='24' cy='44' r='3' fill='%23fbbf24'/%3E%3Ccircle cx='40' cy='44' r='3' fill='%23fbbf24'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface text-gray-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
