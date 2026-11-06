const fs = require('fs');

// Patch CentralBookingsRentalsView
let bCode = fs.readFileSync('components/bookings/CentralBookingsRentalsView.tsx', 'utf8');

if (!bCode.includes('memo(')) {
  bCode = bCode.replace(
    'import { useCallback, useEffect, useState, useRef } from "react";',
    'import { useCallback, useEffect, useState, useRef, useMemo, memo } from "react";'
  );
}

// Wrap handlers in useCallback
bCode = bCode.replace(
  'const handleApproveBooking = async (bookingId: string) => {',
  'const handleApproveBooking = useCallback(async (bookingId: string) => {'
);
bCode = bCode.replace(
  'setBusyId(null);\n    }\n  };\n\n  // ─── Manager Booking Rejection Action',
  'setBusyId(null);\n    }\n  }, [isAdmin, fetchBookings, fetchRentals, fetchMetrics]);\n\n  // ─── Manager Booking Rejection Action'
);

// Fallback CRLF
bCode = bCode.replace(
  'setBusyId(null);\r\n    }\r\n  };\r\n\r\n  // ─── Manager Booking Rejection Action',
  'setBusyId(null);\r\n    }\r\n  }, [isAdmin, fetchBookings, fetchRentals, fetchMetrics]);\r\n\r\n  // ─── Manager Booking Rejection Action'
);

bCode = bCode.replace(
  'const handleRejectBooking = async () => {',
  'const handleRejectBooking = useCallback(async () => {'
);
bCode = bCode.replace(
  'setBusyId(null);\n    }\n  };\n\n  // ─── Manager Direct Rental Creation',
  'setBusyId(null);\n    }\n  }, [rejectingBooking, isAdmin, rejectReason, fetchBookings, fetchMetrics]);\n\n  // ─── Manager Direct Rental Creation'
);
bCode = bCode.replace(
  'setBusyId(null);\r\n    }\r\n  };\r\n\r\n  // ─── Manager Direct Rental Creation',
  'setBusyId(null);\r\n    }\r\n  }, [rejectingBooking, isAdmin, rejectReason, fetchBookings, fetchMetrics]);\r\n\r\n  // ─── Manager Direct Rental Creation'
);

// Wrap default export with memo
bCode = bCode.replace(
  'export default function CentralBookingsRentalsView({',
  'function CentralBookingsRentalsView({'
);
if (!bCode.includes('export default memo(CentralBookingsRentalsView);')) {
  bCode += '\nexport default memo(CentralBookingsRentalsView);\n';
}

fs.writeFileSync('components/bookings/CentralBookingsRentalsView.tsx', bCode, 'utf8');
console.log('CentralBookingsRentalsView callbacks & memo applied');

// Patch CentralTransactionsView
let tCode = fs.readFileSync('components/transactions/CentralTransactionsView.tsx', 'utf8');

if (!tCode.includes('memo(')) {
  tCode = tCode.replace(
    'import { useCallback, useEffect, useState, useRef } from "react";',
    'import { useCallback, useEffect, useState, useRef, useMemo, memo } from "react";'
  );
}

// Memoize metrics calculations
const oldMetrics = `  // Unified metrics
  const totalSettlement = paymentsData.totalRevenue || ledgerData.revenue || 0;
  const verifiedCount = paymentsData.totalPaidTransactions || 0;
  const totalDealsCount = ledgerData.total || paymentsData.totalDeals || 0;`;

const newMetrics = `  // Unified metrics (Memoized)
  const totalSettlement = useMemo(() => paymentsData.totalRevenue || ledgerData.revenue || 0, [paymentsData.totalRevenue, ledgerData.revenue]);
  const verifiedCount = useMemo(() => paymentsData.totalPaidTransactions || 0, [paymentsData.totalPaidTransactions]);
  const totalDealsCount = useMemo(() => ledgerData.total || paymentsData.totalDeals || 0, [ledgerData.total, paymentsData.totalDeals]);`;

tCode = tCode.replace(oldMetrics.replace(/\n/g, '\r\n'), newMetrics.replace(/\n/g, '\r\n'));
if (!tCode.includes('// Unified metrics (Memoized)')) {
  tCode = tCode.replace(oldMetrics, newMetrics);
}

// Wrap default export with memo
tCode = tCode.replace(
  'export default function CentralTransactionsView({',
  'function CentralTransactionsView({'
);
if (!tCode.includes('export default memo(CentralTransactionsView);')) {
  tCode += '\nexport default memo(CentralTransactionsView);\n';
}

fs.writeFileSync('components/transactions/CentralTransactionsView.tsx', tCode, 'utf8');
console.log('CentralTransactionsView callbacks & memo applied');

