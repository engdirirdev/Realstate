const fs = require('fs');
let code = fs.readFileSync('components/bookings/CentralBookingsRentalsView.tsx', 'utf8');

code = code.replace(
  'import { useCallback, useEffect, useState } from "react";',
  'import { useCallback, useEffect, useState, useRef } from "react";'
);

const targetInterface = `interface CentralBookingsRentalsViewProps {
  isAdmin?: boolean;
  initialTab?: "bookings" | "rentals";
  initialDirectOpen?: boolean;
  initialCustomerId?: string;
}`;

const replInterface = `interface CentralBookingsRentalsViewProps {
  isAdmin?: boolean;
  initialTab?: "bookings" | "rentals";
  initialDirectOpen?: boolean;
  initialCustomerId?: string;
  initialBookings?: any[];
  initialRentals?: any[];
  initialMetrics?: {
    pendingBookings: number;
    approvedBookings: number;
    activeRentals: number;
    expiringSoon: number;
  };
  initialBookingTotal?: number;
  initialRentalTotal?: number;
}`;

code = code.replace(targetInterface, replInterface);

const targetProps = `export default function CentralBookingsRentalsView({
  isAdmin = false,
  initialTab = "bookings",
  initialDirectOpen = false,
  initialCustomerId,
}: CentralBookingsRentalsViewProps) {
  // Segmented control: "bookings" | "rentals" (Section 4)
  const [activeTab, setActiveTab] = useState<"bookings" | "rentals">(initialTab);

  // ─── TAB 1: RENTAL BOOKINGS STATE ───
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(0);

  // ─── TAB 2: ACTIVE RENTALS STATE ───
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState<string | null>(null);
  const [rentalStatusFilter, setRentalStatusFilter] = useState("ALL");
  const [rentalSearch, setRentalSearch] = useState("");
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalTotal, setRentalTotal] = useState(0);

  // ─── ONLY 4 SUMMARY CARDS (Section 3) ───
  const [metrics, setMetrics] = useState({
    pendingBookings: 0,
    approvedBookings: 0,
    activeRentals: 0,
    expiringSoon: 0,
  });`;

const replProps = `export default function CentralBookingsRentalsView({
  isAdmin = false,
  initialTab = "bookings",
  initialDirectOpen = false,
  initialCustomerId,
  initialBookings,
  initialRentals,
  initialMetrics,
  initialBookingTotal,
  initialRentalTotal,
}: CentralBookingsRentalsViewProps) {
  // Segmented control: "bookings" | "rentals" (Section 4)
  const [activeTab, setActiveTab] = useState<"bookings" | "rentals">(initialTab);

  // ─── TAB 1: RENTAL BOOKINGS STATE (SSR pre-hydrated for 0ms render) ───
  const [bookings, setBookings] = useState<any[]>(initialBookings || []);
  const [bookingsLoading, setBookingsLoading] = useState(initialBookings ? false : true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingTotal, setBookingTotal] = useState(initialBookingTotal ?? (initialBookings?.length || 0));

  // ─── TAB 2: ACTIVE RENTALS STATE (SSR pre-hydrated for 0ms render) ───
  const [rentals, setRentals] = useState<any[]>(initialRentals || []);
  const [rentalsLoading, setRentalsLoading] = useState(initialRentals ? false : true);
  const [rentalsError, setRentalsError] = useState<string | null>(null);
  const [rentalStatusFilter, setRentalStatusFilter] = useState("ALL");
  const [rentalSearch, setRentalSearch] = useState("");
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalTotal, setRentalTotal] = useState(initialRentalTotal ?? (initialRentals?.length || 0));

  // ─── ONLY 4 SUMMARY CARDS (Section 3) ───
  const [metrics, setMetrics] = useState(
    initialMetrics || {
      pendingBookings: 0,
      approvedBookings: 0,
      activeRentals: 0,
      expiringSoon: 0,
    }
  );`;

code = code.replace(targetProps, replProps);

const targetMount = `  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    } else {
      fetchRentals();
    }
  }, [activeTab, fetchBookings, fetchRentals]);`;

const replMount = `  const isInitialBookingsMount = useRef(true);
  const isInitialRentalsMount = useRef(true);

  useEffect(() => {
    if (!initialMetrics) {
      fetchMetrics();
    }
  }, [fetchMetrics, initialMetrics]);

  useEffect(() => {
    if (activeTab === "bookings") {
      if (isInitialBookingsMount.current) {
        isInitialBookingsMount.current = false;
        if (initialBookings) return;
      }
      fetchBookings();
    } else {
      if (isInitialRentalsMount.current) {
        isInitialRentalsMount.current = false;
        if (initialRentals) return;
      }
      fetchRentals();
    }
  }, [activeTab, fetchBookings, fetchRentals, initialBookings, initialRentals]);`;

code = code.replace(targetMount, replMount);

fs.writeFileSync('components/bookings/CentralBookingsRentalsView.tsx', code, 'utf8');
console.log('CentralBookingsRentalsView patched successfully');

