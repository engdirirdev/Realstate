const fs = require('fs');
const path = require('path');

// 1. AdminCategoriesClient.tsx
const catPath = path.join(__dirname, '..', 'components', 'admin', 'AdminCategoriesClient.tsx');
let catCode = fs.readFileSync(catPath, 'utf8');

catCode = catCode.replace(
  'import { useState } from "react";',
  'import { useState, useCallback, memo } from "react";'
);
catCode = catCode.replace(
  'export default function AdminCategoriesClient({ initialCategories }: AdminCategoriesClientProps) {',
  'function AdminCategoriesClient({ initialCategories }: AdminCategoriesClientProps) {'
);
catCode = catCode.replace(
  '  const fetchCategories = async () => {',
  '  const fetchCategories = useCallback(async () => {'
);
catCode = catCode.replace(
  '    } catch {\n      toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" });\n    }\n  };',
  '    } catch {\n      toast({ title: "Error", description: "Failed to load categories.", variant: "destructive" });\n    }\n  }, []);'
);
catCode = catCode.replace(
  '  const handleCreate = async (e: React.FormEvent) => {',
  '  const handleCreate = useCallback(async (e: React.FormEvent) => {'
);
catCode = catCode.replace(
  '    } finally {\n      setSubmitting(false);\n    }\n  };',
  '    } finally {\n      setSubmitting(false);\n    }\n  }, [form, fetchCategories]);'
);
catCode = catCode.replace(
  '  const openEditModal = (cat: CategoryItem) => {',
  '  const openEditModal = useCallback((cat: CategoryItem) => {'
);
catCode = catCode.replace(
  '    setEditModalOpen(true);\n  };',
  '    setEditModalOpen(true);\n  }, []);'
);
catCode = catCode.replace(
  '  const handleUpdate = async (e: React.FormEvent) => {',
  '  const handleUpdate = useCallback(async (e: React.FormEvent) => {'
);
catCode = catCode.replace(
  '    } finally {\n      setUpdating(false);\n    }\n  };',
  '    } finally {\n      setUpdating(false);\n    }\n  }, [editingCategory, editForm, fetchCategories]);'
);
catCode = catCode.replace(
  '  const handleDelete = async (id: string, name: string) => {',
  '  const handleDelete = useCallback(async (id: string, name: string) => {'
);
catCode = catCode.replace(
  '    } catch {\n      toast({ title: "Error", description: "Failed to delete category." });\n    }\n  };',
  '    } catch {\n      toast({ title: "Error", description: "Failed to delete category." });\n    }\n  }, []);'
);
if (!catCode.includes('export default memo(AdminCategoriesClient);')) {
  catCode += '\nexport default memo(AdminCategoriesClient);\n';
}
fs.writeFileSync(catPath, catCode, 'utf8');
console.log('Optimized AdminCategoriesClient.tsx');

