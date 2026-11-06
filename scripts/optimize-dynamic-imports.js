const fs = require('fs');
const path = require('path');

// 1. app/(public)/properties/[id]/page.tsx
const idPath = path.join(__dirname, '..', 'app', '(public)', 'properties', '[id]', 'page.tsx');
let idCode = fs.readFileSync(idPath, 'utf8');

idCode = idCode.replace(
  'const PropertyCompareModal = dynamic(() => import("@/components/property/PropertyCompareModal"));',
  'const PropertyCompareModal = dynamic(() => import("@/components/property/PropertyCompareModal"), { ssr: false });'
);
idCode = idCode.replace(
  'const PropertyScheduleTourModal = dynamic(() => import("@/components/property/PropertyScheduleTourModal"));',
  'const PropertyScheduleTourModal = dynamic(() => import("@/components/property/PropertyScheduleTourModal"), { ssr: false });'
);
idCode = idCode.replace(
  'const PropertyReviews = dynamic(() => import("@/components/PropertyReviews"));',
  `const PropertyReviews = dynamic(() => import("@/components/PropertyReviews"), {
  loading: () => (
    <div className="p-8 rounded-3xl bg-[#FCFBF7] border border-[#E8E1D4] animate-pulse space-y-3">
      <div className="h-6 w-40 bg-[#E8E1D4] rounded-lg" />
      <div className="h-4 w-64 bg-[#E8E1D4]/60 rounded" />
    </div>
  ),
});`
);

fs.writeFileSync(idPath, idCode, 'utf8');
console.log('Updated app/(public)/properties/[id]/page.tsx dynamic imports');

// 2. app/(public)/properties/page.tsx: add revalidate = 60
const propPagePath = path.join(__dirname, '..', 'app', '(public)', 'properties', 'page.tsx');
let propPageCode = fs.readFileSync(propPagePath, 'utf8');
if (!propPageCode.includes('export const revalidate = 60;')) {
  propPageCode = propPageCode.replace(
    'export const metadata: Metadata = {',
    'export const revalidate = 60;\n\nexport const metadata: Metadata = {'
  );
  fs.writeFileSync(propPagePath, propPageCode, 'utf8');
  console.log('Added export const revalidate = 60 to app/(public)/properties/page.tsx');
}

