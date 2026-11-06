const fs = require('fs');
const path = require('path');

// 1. ManagerInquiriesClient.tsx
const inqPath = path.join(__dirname, '..', 'components', 'dashboard', 'ManagerInquiriesClient.tsx');
let inqCode = fs.readFileSync(inqPath, 'utf8');
inqCode = inqCode.replace(
  'import { useState, useRef } from "react";',
  'import { useState, useRef, useCallback, memo } from "react";'
);
inqCode = inqCode.replace(
  'export default function ManagerInquiriesClient({ initialInquiries = [] }: ManagerInquiriesClientProps) {',
  'function ManagerInquiriesClient({ initialInquiries = [] }: ManagerInquiriesClientProps) {'
);
inqCode = inqCode.replace(
  '  const fetchInquiries = async () => {',
  '  const fetchInquiries = useCallback(async () => {'
);
inqCode = inqCode.replace(
  '    } catch {\n      toast({ title: "Error", description: "Failed to load inquiries.", variant: "destructive" });\n    }\n  };',
  '    } catch {\n      toast({ title: "Error", description: "Failed to load inquiries.", variant: "destructive" });\n    }\n  }, []);'
);
inqCode = inqCode.replace(
  '  const handleOpenReply = (inq: any) => {',
  '  const handleOpenReply = useCallback((inq: any) => {'
);
inqCode = inqCode.replace(
  '    setReplyModalOpen(true);\n  };',
  '    setReplyModalOpen(true);\n  }, []);'
);
inqCode = inqCode.replace(
  '  const handleSendReply = async () => {',
  '  const handleSendReply = useCallback(async () => {'
);
inqCode = inqCode.replace(
  '    } finally {\n      setSubmittingReply(false);\n    }\n  };',
  '    } finally {\n      setSubmittingReply(false);\n    }\n  }, [selectedInquiry, replyText, fetchInquiries]);'
);
if (!inqCode.includes('export default memo(ManagerInquiriesClient);')) {
  inqCode += '\nexport default memo(ManagerInquiriesClient);\n';
}
fs.writeFileSync(inqPath, inqCode, 'utf8');
console.log('Optimized ManagerInquiriesClient.tsx');

// 2. ManagerCustomersClient.tsx
const custPath = path.join(__dirname, '..', 'components', 'dashboard', 'ManagerCustomersClient.tsx');
let custCode = fs.readFileSync(custPath, 'utf8');
custCode = custCode.replace(
  'import { useState, useEffect, useMemo, useRef } from "react";',
  'import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";'
);
custCode = custCode.replace(
  'export default function ManagerCustomersClient({ initialCustomers }: ManagerCustomersClientProps) {',
  'function ManagerCustomersClient({ initialCustomers }: ManagerCustomersClientProps) {'
);
if (!custCode.includes('export default memo(ManagerCustomersClient);')) {
  custCode += '\nexport default memo(ManagerCustomersClient);\n';
}
fs.writeFileSync(custPath, custCode, 'utf8');
console.log('Optimized ManagerCustomersClient.tsx');

