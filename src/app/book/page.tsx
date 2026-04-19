import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata = {
  title: "Book a Ride — Connect Travel",
  description:
    "Book an affordable shared ride from Buffalo to visit your loved one at a Western NY correctional facility.",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-primary-dark text-center">
          Book Your Ride
        </h1>
        <p className="mt-2 text-center text-gray-500">
          Follow the steps below to reserve your seat.
        </p>
        <div className="mt-10">
          <BookingWizard />
        </div>
      </div>
    </div>
  );
}
