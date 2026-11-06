const fs = require('fs');
const path = require('path');

function getClientFiles(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next' && item.name !== '.git' && item.name !== 'thesis') {
        res = res.concat(getClientFiles(full));
      }
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('"use client"') || content.includes("'use client'")) {
        res.push({ file: full, content });
      }
    }
  }
  return res;
}

const files = getClientFiles('.');
console.log('Total client files:', files.length);

for (const f of files) {
  const matches = f.content.match(/useEffect\s*\(/g);
  if (matches && matches.length > 2) {
    console.log(f.file.replace(/\\/g, '/'), 'has', matches.length, 'useEffect hooks');
  }
}

