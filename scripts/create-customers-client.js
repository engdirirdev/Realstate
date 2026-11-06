const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/customers/page.tsx', 'utf8');

// Add useRef to React import
code = code.replace(
  'import { useState, useEffect, useMemo } from "react";',
  'import { useState, useEffect, useMemo, useRef } from "react";'
);

// Add initialCustomers prop
const targetDef = `export default function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);`;

const replDef = `interface ManagerCustomersClientProps {
  initialCustomers?: CustomerRecord[];
}

export default function ManagerCustomersClient({ initialCustomers }: ManagerCustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers || []);
  const [loading, setLoading] = useState(initialCustomers ? false : true);`;

code = code.replace(targetDef, replDef);

// Update mount effect to skip initial fetch if initialCustomers is provided
const targetEffect = `  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);`;

const replEffect = `  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialCustomers && !searchQuery && statusFilter === "ALL") {
        return;
      }
    }
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, initialCustomers]);`;

code = code.replace(targetEffect, replEffect);

fs.writeFileSync('components/dashboard/ManagerCustomersClient.tsx', code, 'utf8');
console.log('ManagerCustomersClient created successfully');

