const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'app', '(admin)', 'admin');
const dashboardDir = path.join(__dirname, '..', 'app', '(dashboard)', 'dashboard');
const customerDir = path.join(__dirname, '..', 'app', '(customer)', 'customer');

function addRobotsToPages(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      addRobotsToPages(fullPath);
    } else if (entry.name === 'page.tsx') {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('export const metadata') && !code.includes('robots:')) {
        // Add robots: { index: false, follow: false }
        code = code.replace(
          /(export const metadata:\s*Metadata\s*=\s*\{[\s\S]*?)(\n\};)/,
          (match, p1, p2) => {
            return p1 + '\n  robots: { index: false, follow: false },' + p2;
          }
        );
        fs.writeFileSync(fullPath, code, 'utf8');
        console.log(`Added robots protection to ${fullPath}`);
      }
    }
  }
}

addRobotsToPages(adminDir);
addRobotsToPages(dashboardDir);
addRobotsToPages(customerDir);
console.log('Finished updating private routes with robots metadata protection');

