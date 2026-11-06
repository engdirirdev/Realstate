const fs = require('fs');
const path = require('path');

function scan(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) scan(full);
    else if (e.name === 'page.tsx') {
      const txt = fs.readFileSync(full, 'utf8');
      const isClient = txt.includes('"use client"') || txt.includes("'use client'");
      const hasFetch = txt.includes('fetch(');
      const hasPrisma = txt.includes('prisma.');
      const hasRevalidate = txt.includes('revalidate');
      console.log(full.replace('app\\(admin)\\admin', 'ADMIN:').replace('app\\(dashboard)\\dashboard', 'DASHBOARD:').replace('app\\(customer)\\customer', 'CUSTOMER:'), 
        isClient ? '[CLIENT]' : '[SERVER]', 
        hasPrisma ? 'Prisma:YES' : 'Prisma:NO', 
        hasFetch ? 'Fetch:YES' : 'Fetch:NO',
        hasRevalidate ? 'Reval:YES' : 'Reval:NO'
      );
    }
  }
}

console.log('--- ADMIN PAGES ---');
scan('app/(admin)/admin');
console.log('--- DASHBOARD PAGES ---');
scan('app/(dashboard)/dashboard');
console.log('--- CUSTOMER PAGES ---');
scan('app/(customer)/customer');

