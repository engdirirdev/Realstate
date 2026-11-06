const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'AdminUserInspectionClient.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Fix imports
code = code.replace(
  'import { useState, useEffect, use } from "react";',
  'import { useState, useCallback, memo } from "react";'
);

// Replace lines 24-34
code = code.replace(
  /type Props = \{ params: Promise<\{ id: string \}> \};\s*export default function AdminUserReviewPage\(\{ params \}: Props\) \{\s*const \{ id \} = use\(params\);\s*const router = useRouter\(\);\s*const \[user, setUser\] = useState<any>\(null\);\s*const \[loading, setLoading\] = useState\(true\);\s*const \[updating, setUpdating\] = useState\(false\);/,
  `interface AdminUserInspectionClientProps {
  initialUser: any;
}

function AdminUserInspectionClient({ initialUser }: AdminUserInspectionClientProps) {
  const router = useRouter();
  const id = initialUser?.id;
  const [user, setUser] = useState<any>(initialUser);
  const [loading] = useState(false);
  const [updating, setUpdating] = useState(false);`
);

// Ensure single export default memo at the bottom
code = code.replace(/\nexport default memo\(AdminUserInspectionClient\);\s*$/, '');
code += '\nexport default memo(AdminUserInspectionClient);\n';

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed components/admin/AdminUserInspectionClient.tsx');

