const fs = require('fs');
let code = fs.readFileSync('components/admin/AdminUsersClient.tsx', 'utf8');

code = code.replace(
  'const [users, setUsers] = useState<UserItem[]>([]);\n  const [loading, setLoading] = useState(true);',
  'const [users, setUsers] = useState<UserItem[]>(initialUsers && initialUsers.length > 0 ? initialUsers : []);\n  const [loading, setLoading] = useState(initialUsers && initialUsers.length > 0 ? false : true);\n  const isInitialMount = useRef(true);'
);

// Fallback in case of CRLF
if (!code.includes('isInitialMount')) {
  code = code.replace(
    'const [users, setUsers] = useState<UserItem[]>([]);\r\n  const [loading, setLoading] = useState(true);',
    'const [users, setUsers] = useState<UserItem[]>(initialUsers && initialUsers.length > 0 ? initialUsers : []);\r\n  const [loading, setLoading] = useState(initialUsers && initialUsers.length > 0 ? false : true);\r\n  const isInitialMount = useRef(true);'
  );
}

const targetEffect = `  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => fetchUsers(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchUsers]);`;

const replEffect = `  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialUsers && initialUsers.length > 0 && !searchQuery && activeTab === "ALL" && statusFilter === "ALL") {
        return;
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => fetchUsers(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchUsers, initialUsers, searchQuery, activeTab, statusFilter]);`;

code = code.replace(targetEffect.replace(/\n/g, '\r\n'), replEffect.replace(/\n/g, '\r\n'));
if (!code.includes('isInitialMount.current = false;')) {
  code = code.replace(targetEffect, replEffect);
}

// Add memo to default export
code = code.replace(
  'import { useState, useEffect, useCallback, useRef, Suspense } from "react";',
  'import { useState, useEffect, useCallback, useRef, Suspense, memo } from "react";'
);
code = code.replace(
  'export default function AdminUsersClient({ initialUsers = [] }: { initialUsers?: UserItem[] }) {',
  'function AdminUsersClient({ initialUsers = [] }: { initialUsers?: UserItem[] }) {'
);
if (!code.includes('export default memo(AdminUsersClient);')) {
  code += '\nexport default memo(AdminUsersClient);\n';
}

fs.writeFileSync('components/admin/AdminUsersClient.tsx', code, 'utf8');
console.log('AdminUsersClient patched successfully');

