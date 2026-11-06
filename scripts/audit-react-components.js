const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next' && item.name !== '.git' && item.name !== 'thesis') {
        res = res.concat(getFiles(full));
      }
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n').length;
      const isClient = content.includes('"use client"') || content.includes("'use client'");
      const hasMemo = content.includes('React.memo') || content.includes('memo(');
      const hasUseMemo = content.includes('useMemo');
      const hasUseCallback = content.includes('useCallback');
      const hasUseEffect = content.includes('useEffect');
      const hasDynamic = content.includes('dynamic(');
      res.push({
        file: full,
        lines,
        isClient,
        hasMemo,
        hasUseMemo,
        hasUseCallback,
        hasUseEffect,
        hasDynamic
      });
    }
  }
  return res;
}

const all = getFiles('.').filter(f => f.isClient).sort((a,b) => b.lines - a.lines);
console.log('Total client components:', all.length);
console.log('Top 20 largest client components:');
console.log(all.slice(0, 20).map(c => ({
  file: c.file.replace(/\\/g, '/'),
  lines: c.lines,
  memo: c.hasMemo,
  useMemo: c.hasUseMemo,
  useCallback: c.hasUseCallback,
  useEffect: c.hasUseEffect,
  dynamic: c.hasDynamic
})));

