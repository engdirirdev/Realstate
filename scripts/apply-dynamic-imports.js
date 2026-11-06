const fs = require('fs');
const path = require('path');

// 1. app/(public)/properties/[id]/page.tsx
const propDetailPath = path.join(__dirname, '..', 'app', '(public)', 'properties', '[id]', 'page.tsx');
let propDetailCode = fs.readFileSync(propDetailPath, 'utf8');

propDetailCode = propDetailCode.replace(
  'import AIPropertyInsights from "@/components/property/AIPropertyInsights";',
  '// AIPropertyInsights dynamically imported below'
);
propDetailCode = propDetailCode.replace(
  'import PropertyMapSection from "@/components/property/PropertyMapSection";',
  '// PropertyMapSection dynamically imported below'
);

const dynamicDetailSnippet = `// Code-split dynamic client components
const PropertyMapSection = dynamic(() => import("@/components/property/PropertyMapSection"), {
  loading: () => (
    <div className="h-96 rounded-2xl bg-[#FCFBF7] border border-[#E8E1D4] animate-pulse flex items-center justify-center text-[#6B7280] text-sm font-medium">
      Loading Neighborhood Map &amp; Commute Insights...
    </div>
  ),
});

const AIPropertyInsights = dynamic(() => import("@/components/property/AIPropertyInsights"), {
  loading: () => (
    <div className="h-64 rounded-2xl bg-[#FCFBF7] border border-[#E8E1D4] animate-pulse flex items-center justify-center text-[#6B7280] text-sm font-medium">
      Loading AI Valuation Insights...
    </div>
  ),
});`;

propDetailCode = propDetailCode.replace(
  '// Code-split dynamic client components',
  dynamicDetailSnippet
);
fs.writeFileSync(propDetailPath, propDetailCode, 'utf8');
console.log('Optimized app/(public)/properties/[id]/page.tsx with dynamic imports');

// 2. app/(admin)/admin/properties/add/page.tsx
const adminAddPath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'properties', 'add', 'page.tsx');
let adminAddCode = fs.readFileSync(adminAddPath, 'utf8');
adminAddCode = adminAddCode.replace(
  'import { ArrowLeft, Sparkles } from "lucide-react";\nimport DynamicPropertyForm from "@/components/property/DynamicPropertyForm";',
  `import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicPropertyForm = dynamic(() => import("@/components/property/DynamicPropertyForm"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      <p className="text-sm font-medium text-[#6B7280]">Initializing dynamic property form engine...</p>
    </div>
  ),
});`
);
fs.writeFileSync(adminAddPath, adminAddCode, 'utf8');
console.log('Optimized admin properties add page');

// 3. app/(admin)/admin/properties/[id]/edit/page.tsx
const adminEditPath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'properties', '[id]', 'edit', 'page.tsx');
let adminEditCode = fs.readFileSync(adminEditPath, 'utf8');
adminEditCode = adminEditCode.replace(
  'import DynamicPropertyForm from "@/components/property/DynamicPropertyForm";',
  `import dynamic from "next/dynamic";

const DynamicPropertyForm = dynamic(() => import("@/components/property/DynamicPropertyForm"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      <p className="text-sm font-medium text-[#6B7280]">Loading dynamic property editor engine...</p>
    </div>
  ),
});`
);
fs.writeFileSync(adminEditPath, adminEditCode, 'utf8');
console.log('Optimized admin properties edit page');

// 4. app/(dashboard)/dashboard/properties/add/page.tsx
const dashAddPath = path.join(__dirname, '..', 'app', '(dashboard)', 'dashboard', 'properties', 'add', 'page.tsx');
let dashAddCode = fs.readFileSync(dashAddPath, 'utf8');
dashAddCode = dashAddCode.replace(
  'import { ArrowLeft, Sparkles } from "lucide-react";\nimport DynamicPropertyForm from "@/components/property/DynamicPropertyForm";',
  `import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicPropertyForm = dynamic(() => import("@/components/property/DynamicPropertyForm"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      <p className="text-sm font-medium text-[#6B7280]">Initializing dynamic property form engine...</p>
    </div>
  ),
});`
);
fs.writeFileSync(dashAddPath, dashAddCode, 'utf8');
console.log('Optimized dashboard properties add page');

// 5. app/(dashboard)/dashboard/properties/[id]/edit/page.tsx
const dashEditPath = path.join(__dirname, '..', 'app', '(dashboard)', 'dashboard', 'properties', '[id]', 'edit', 'page.tsx');
let dashEditCode = fs.readFileSync(dashEditPath, 'utf8');
dashEditCode = dashEditCode.replace(
  'import DynamicPropertyForm from "@/components/property/DynamicPropertyForm";',
  `import dynamic from "next/dynamic";

const DynamicPropertyForm = dynamic(() => import("@/components/property/DynamicPropertyForm"), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      <p className="text-sm font-medium text-[#6B7280]">Loading dynamic property editor engine...</p>
    </div>
  ),
});`
);
fs.writeFileSync(dashEditPath, dashEditCode, 'utf8');
console.log('Optimized dashboard properties edit page');

