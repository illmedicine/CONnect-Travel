import { DriverDashboard } from "@/components/driver/driver-dashboard";

export const metadata = {
  title: "Driver Portal — Connect Travel",
  description:
    "Earn up to $540 per trip driving families to Western NY correctional facilities. Join the Connect Travel driver network.",
};

export default function DriverPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DriverDashboard />
      </div>
    </div>
  );
}
