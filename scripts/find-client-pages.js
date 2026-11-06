const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('page.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('use client')) {
        if (content.includes('useEffect') && content.includes('fetch(')) {
          results.push(full);
        }
      }
    }
  }
  return results;
}

const found = walk('app');
console.log(JSON.stringify(found, null, 2));

