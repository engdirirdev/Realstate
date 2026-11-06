const fs = require('fs');
let code = fs.readFileSync('components/property/PropertyMediaGallery.tsx', 'utf8');
code = code.replace('useCallback } from "react";', 'useCallback, memo } from "react";');
fs.writeFileSync('components/property/PropertyMediaGallery.tsx', code, 'utf8');
console.log('Fixed PropertyMediaGallery');

