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
