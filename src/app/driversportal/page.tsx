import type { Metadata } from "next";
import DriversPortalShell from "@/components/drivers-portal/portal-shell";

export const metadata: Metadata = {
  title: "Drivers Portal | ConNetwork Travel",
  description:
    "Registered drivers sign in with Google to view trip requests, message riders, and share live GPS within the 1-hour pre-trip window.",
};

export default function DriversPortalPage() {
  return <DriversPortalShell />;
}
