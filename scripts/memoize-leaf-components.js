const fs = require('fs');

function memoizeFile(filePath, funcName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure memo is imported
  if (!content.includes('memo') || !content.includes('from "react"')) {
    if (content.includes('import {') && content.includes('} from "react";')) {
      content = content.replace(/import\s*\{([^}]+)\}\s*from\s*"react";/, (m, g) => {
        if (!g.includes('memo')) {
          return `import {${g}, memo } from "react";`;
        }
        return m;
      });
    } else {
      content = 'import { memo } from "react";\n' + content;
    }
  }

  // Replace export default function FuncName with function FuncName and export at bottom
  if (content.includes(`export default function ${funcName}`)) {
    content = content.replace(`export default function ${funcName}`, `function ${funcName}`);
    content += `\nexport default memo(${funcName});\n`;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Memoized: ${filePath}`);
}

memoizeFile('components/transactions/StatusBadge.tsx', 'StatusBadge');
memoizeFile('components/PropertyCostSummary.tsx', 'PropertyCostSummary');
memoizeFile('components/property/PropertyDynamicSpecs.tsx', 'PropertyDynamicSpecs');
memoizeFile('components/property/PropertyDocumentsSection.tsx', 'PropertyDocumentsSection');
memoizeFile('components/property/PropertyStatsPanel.tsx', 'PropertyStatsPanel');
memoizeFile('components/property/PropertyAvailabilityBadge.tsx', 'PropertyAvailabilityBadge');
memoizeFile('components/property/PropertyShareSection.tsx', 'PropertyShareSection');
memoizeFile('components/PropertyShareAndReport.tsx', 'PropertyShareAndReport');
memoizeFile('components/customer/CustomerHeroSearch.tsx', 'CustomerHeroSearch');
memoizeFile('components/customer/CustomerPropertiesFilterForm.tsx', 'CustomerPropertiesFilterForm');
memoizeFile('components/properties/PropertiesSearchFilterForm.tsx', 'PropertiesSearchFilterForm');
memoizeFile('components/property/PropertyCompareModal.tsx', 'PropertyCompareModal');
memoizeFile('components/property/PropertyMediaGallery.tsx', 'PropertyMediaGallery');
memoizeFile('components/property/PropertyMapSection.tsx', 'PropertyMapSection');
memoizeFile('components/dashboard/DashboardPricePrediction.tsx', 'DashboardPricePrediction');

