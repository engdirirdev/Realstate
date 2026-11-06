const fs = require('fs');
const path = require('path');

// 1. AdminLocationsClient.tsx
const locPath = path.join(__dirname, '..', 'components', 'admin', 'AdminLocationsClient.tsx');
let locCode = fs.readFileSync(locPath, 'utf8');
locCode = locCode.replace(
  'import { useState } from "react";',
  'import { useState, useCallback, memo } from "react";'
);
locCode = locCode.replace(
  'export default function AdminLocationsClient({ initialLocations }: AdminLocationsClientProps) {',
  'function AdminLocationsClient({ initialLocations }: AdminLocationsClientProps) {'
);
locCode = locCode.replace(
  '  const fetchLocations = async () => {',
  '  const fetchLocations = useCallback(async () => {'
);
locCode = locCode.replace(
  '    } catch {\n      toast({ title: "Error", description: "Failed to load locations.", variant: "destructive" });\n    }\n  };',
  '    } catch {\n      toast({ title: "Error", description: "Failed to load locations.", variant: "destructive" });\n    }\n  }, []);'
);
locCode = locCode.replace(
  '  const handleCreate = async (e: React.FormEvent) => {',
  '  const handleCreate = useCallback(async (e: React.FormEvent) => {'
);
locCode = locCode.replace(
  '    } finally {\n      setSubmitting(false);\n    }\n  };',
  '    } finally {\n      setSubmitting(false);\n    }\n  }, [form, fetchLocations]);'
);
locCode = locCode.replace(
  '  const openEditModal = (loc: LocationItem) => {',
  '  const openEditModal = useCallback((loc: LocationItem) => {'
);
locCode = locCode.replace(
  '    setEditModalOpen(true);\n  };',
  '    setEditModalOpen(true);\n  }, []);'
);
locCode = locCode.replace(
  '  const handleUpdate = async (e: React.FormEvent) => {',
  '  const handleUpdate = useCallback(async (e: React.FormEvent) => {'
);
locCode = locCode.replace(
  '    } finally {\n      setUpdating(false);\n    }\n  };',
  '    } finally {\n      setUpdating(false);\n    }\n  }, [editingLocation, editForm, fetchLocations]);'
);
locCode = locCode.replace(
  '  const handleDelete = async (id: string, city: string) => {',
  '  const handleDelete = useCallback(async (id: string, city: string) => {'
);
locCode = locCode.replace(
  '    } catch {\n      toast({ title: "Error", description: "Failed to delete location." });\n    }\n  };',
  '    } catch {\n      toast({ title: "Error", description: "Failed to delete location." });\n    }\n  }, []);'
);
if (!locCode.includes('export default memo(AdminLocationsClient);')) {
  locCode += '\nexport default memo(AdminLocationsClient);\n';
}
fs.writeFileSync(locPath, locCode, 'utf8');
console.log('Optimized AdminLocationsClient.tsx');

// 2. AdminAuditLogsClient.tsx
const auditPath = path.join(__dirname, '..', 'components', 'admin', 'AdminAuditLogsClient.tsx');
let auditCode = fs.readFileSync(auditPath, 'utf8');
auditCode = auditCode.replace(
  'import { useState } from "react";',
  'import { useState, memo } from "react";'
);
auditCode = auditCode.replace(
  'export default function AdminAuditLogsClient({ initialLogs }: AdminAuditLogsClientProps) {',
  'function AdminAuditLogsClient({ initialLogs }: AdminAuditLogsClientProps) {'
);
if (!auditCode.includes('export default memo(AdminAuditLogsClient);')) {
  auditCode += '\nexport default memo(AdminAuditLogsClient);\n';
}
fs.writeFileSync(auditPath, auditCode, 'utf8');
console.log('Optimized AdminAuditLogsClient.tsx');

// 3. AdminSettingsClient.tsx
const setPath = path.join(__dirname, '..', 'components', 'admin', 'AdminSettingsClient.tsx');
let setCode = fs.readFileSync(setPath, 'utf8');
setCode = setCode.replace(
  'import { useState, useEffect } from "react";',
  'import { useState, useEffect, useCallback, memo } from "react";'
);
setCode = setCode.replace(
  'export default function AdminSettingsClient({',
  'function AdminSettingsClient({'
);
setCode = setCode.replace(
  '  const fetchSettings = async () => {',
  '  const fetchSettings = useCallback(async () => {'
);
setCode = setCode.replace(
  '    } finally {\n      setLoading(false);\n    }\n  };',
  '    } finally {\n      setLoading(false);\n    }\n  }, []);'
);
setCode = setCode.replace(
  '  const handleSave = async (e: React.FormEvent) => {',
  '  const handleSave = useCallback(async (e: React.FormEvent) => {'
);
setCode = setCode.replace(
  '    } finally {\n      setSaving(false);\n    }\n  };',
  '    } finally {\n      setSaving(false);\n    }\n  }, [form]);'
);
if (!setCode.includes('export default memo(AdminSettingsClient);')) {
  setCode += '\nexport default memo(AdminSettingsClient);\n';
}
fs.writeFileSync(setPath, setCode, 'utf8');
console.log('Optimized AdminSettingsClient.tsx');

