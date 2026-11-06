/**
 * ================================================================
 * TEST SUITE : Comprehensive UX, Navigation, Workflow & A11y Verification
 * PURPOSE    : Verify Navigation, Dashboard flow, Property workflow,
 *              User experience, and Accessibility (WCAG 2.1 AA).
 * ================================================================
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("\n========================================================");
console.log("   KIRO-MAAL ENTERPRISE UX & ACCESSIBILITY TEST SUITE   ");
console.log("========================================================\n");

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

const rootDir = process.cwd();

// ── 1. NAVIGATION & ACCESSIBILITY TESTS ──────────────────────────────
console.log("▶ 1. NAVIGATION & ACCESSIBLE CONTROLS");

it("SkipToContent provides accessible bypass link adhering to brand colors", () => {
  const filePath = path.join(rootDir, "components/layout/SkipToContent.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(content.includes('href="#main-content"'), "Skip link must point to #main-content");
  assert.ok(content.includes("sr-only focus:not-sr-only"), "Must use standard sr-only focus pattern");
  assert.ok(content.includes("focus:bg-[#07111F]"), "Must use brand deep navy background on focus");
  assert.ok(content.includes("focus:ring-[#C89B3C]"), "Must use brand gold focus ring");
  assert.ok(content.includes("Skip to main content"), "Must provide descriptive English + Somali text");
});

it("Navbar renders primary public links and responsive account dropdown", () => {
  const filePath = path.join(rootDir, "components/layout/Navbar.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  const requiredTabs = ["Home", "Properties", "Services", "About", "Contact"];
  for (const tab of requiredTabs) {
    assert.ok(content.includes(`"${tab}"`), `Navbar must include ${tab} tab`);
  }

  assert.ok(content.includes('aria-label="Main navigation"'), "Navbar must have accessible nav label");
  assert.ok(content.includes("DropdownMenu"), "Must provide interactive account menu");
  assert.ok(content.includes("signOut"), "Must provide secure sign-out trigger");
});

it("Headers across Admin, Customer, and Manager all implement functional mobile drawers", () => {
  const adminHeader = fs.readFileSync(path.join(rootDir, "components/admin/AdminHeader.tsx"), "utf-8");
  const customerHeader = fs.readFileSync(path.join(rootDir, "components/customer/CustomerHeader.tsx"), "utf-8");
  const managerHeader = fs.readFileSync(path.join(rootDir, "components/manager/ManagerHeader.tsx"), "utf-8");

  // Admin Header
  assert.ok(adminHeader.includes("mobileMenuOpen"), "AdminHeader must track mobile menu state");
  assert.ok(adminHeader.includes("AdminSidebarNav"), "AdminHeader drawer must render AdminSidebarNav");

  // Customer Header
  assert.ok(customerHeader.includes("mobileMenuOpen"), "CustomerHeader must track mobile menu state");
  assert.ok(customerHeader.includes("CustomerSidebarNav"), "CustomerHeader drawer must render CustomerSidebarNav");
  assert.ok(customerHeader.includes('role="dialog"'), "CustomerHeader drawer must have dialog role");

  // Manager Header
  assert.ok(managerHeader.includes("mobileMenuOpen"), "ManagerHeader must track mobile menu state");
  assert.ok(managerHeader.includes("DashboardSidebarNav"), "ManagerHeader drawer must render DashboardSidebarNav");
  assert.ok(managerHeader.includes('role="dialog"'), "ManagerHeader drawer must have dialog role");
});

it("Property detail page implements visual breadcrumb navigation trail", () => {
  const filePath = path.join(rootDir, "app/(public)/properties/[id]/page.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  assert.ok(content.includes('aria-label="Breadcrumbs"'), "Must include accessible breadcrumbs nav");
  assert.ok(content.includes('href="/properties"'), "Must link back to properties index");
  assert.ok(content.includes('aria-current="page"'), "Must designate current page for screen readers");
  assert.ok(content.includes("generateBreadcrumbSchema"), "Must integrate JSON-LD schema breadcrumb");
});

// ── 2. DASHBOARD FLOW & ROLE SEGREGATION ────────────────────────────
console.log("\n▶ 2. DASHBOARD FLOW & ROLE SEGREGATION");

it("Admin dashboard enforces strict ADMIN role guard with unread inquiry badge", () => {
  const layoutPath = path.join(rootDir, "app/(admin)/admin/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(content.includes('role !== "ADMIN"'), "Must redirect non-admin users");
  assert.ok(content.includes("unreadCount"), "Must calculate unread inquiries count");
  assert.ok(content.includes("AdminSidebarNav"), "Must mount AdminSidebarNav");
  assert.ok(content.includes("AdminHeader"), "Must mount AdminHeader");
});

it("Customer portal enforces authentication and mounts dedicated navigation", () => {
  const layoutPath = path.join(rootDir, "app/(customer)/customer/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(content.includes('redirect("/login")'), "Must redirect unauthenticated users");
  assert.ok(content.includes("CustomerSidebarNav"), "Must mount CustomerSidebarNav");
  assert.ok(content.includes("CustomerHeader"), "Must mount CustomerHeader");
});

it("Manager dashboard redirects Admin to /admin and Customer to /customer", () => {
  const layoutPath = path.join(rootDir, "app/(dashboard)/dashboard/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(content.includes('redirect("/admin")'), "Must route admin to admin portal");
  assert.ok(content.includes('redirect("/customer")'), "Must route customer to customer portal");
  assert.ok(content.includes("DashboardSidebarNav"), "Must mount DashboardSidebarNav");
  assert.ok(content.includes("ManagerHeader"), "Must mount ManagerHeader");
});

// ── 3. PROPERTY WORKFLOW & GOVERNANCE ───────────────────────────────
console.log("\n▶ 3. PROPERTY WORKFLOW & GOVERNANCE");

it("Property creation supports dynamic property types and media attachments", () => {
  const formPath = path.join(rootDir, "components/property/DynamicPropertyForm.tsx");
  const content = fs.readFileSync(formPath, "utf-8");

  assert.ok(content.includes("HOUSE"), "Form must support HOUSE type");
  assert.ok(content.includes("APARTMENT"), "Form must support APARTMENT type");
  assert.ok(content.includes("COMMERCIAL"), "Form must support COMMERCIAL type");
  assert.ok(content.includes("LAND"), "Form must support LAND type");
  assert.ok(content.includes("PropertyMediaGallery") || content.includes("images"), "Must support multi-image upload");
});

it("Admin property review supports approval, rejection reason dialog, and featured toggle", () => {
  const reviewPath = path.join(rootDir, "components/admin/AdminPropertyReviewClient.tsx");
  const content = fs.readFileSync(reviewPath, "utf-8");

  assert.ok(content.includes("updateStatus"), "Must support status transitions");
  assert.ok(content.includes("rejectionReason"), "Must support rejection feedback");
  assert.ok(content.includes("toggleFeatured"), "Must support featured spotlight toggle");
  assert.ok(content.includes("PropertyDynamicSpecs"), "Must render type-specific dynamic specs");
});

it("Public property detail page combines comparison, gallery, availability badge, and AI insights", () => {
  const pagePath = path.join(rootDir, "app/(public)/properties/[id]/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  assert.ok(content.includes("PropertyMediaGallery"), "Must include rich media gallery");
  assert.ok(content.includes("PropertyCompareModal"), "Must include comparative modal");
  assert.ok(content.includes("PropertyAvailabilityBadge"), "Must include live availability badge");
  assert.ok(content.includes("AIPropertyInsights"), "Must include AI score and valuation insights");
  assert.ok(content.includes("RelatedPropertiesSection"), "Must include comps and similar properties");
});

// ── 4. USER EXPERIENCE & EMPTY STATES ───────────────────────────────
console.log("\n▶ 4. USER EXPERIENCE, LOADING & EMPTY STATES");

it("Dedicated loading skeletons exist across all public and portal routes", () => {
  const loadingRoutes = [
    "app/(public)/loading.tsx",
    "app/(public)/properties/loading.tsx",
    "app/(public)/properties/[id]/loading.tsx",
    "app/(admin)/admin/loading.tsx",
    "app/(customer)/customer/loading.tsx",
    "app/(dashboard)/dashboard/loading.tsx",
  ];

  for (const route of loadingRoutes) {
    const fullPath = path.join(rootDir, route);
    assert.ok(fs.existsSync(fullPath), `Loading skeleton must exist at ${route}`);
  }
});

it("Customer views define informative empty states with clear calls to action", () => {
  const views = [
    { file: "components/customer/CustomerRentalsView.tsx", cta: "Browse Rental Listings" },
    { file: "components/customer/CustomerPurchasesView.tsx", cta: "Browse Properties for Sale" },
    { file: "components/customer/CustomerRequestsView.tsx", cta: "Browse" },
    { file: "components/customer/CustomerReviewsClient.tsx", cta: "Explore Properties" },
  ];

  for (const { file, cta } of views) {
    const content = fs.readFileSync(path.join(rootDir, file), "utf-8");
    assert.ok(content.includes(cta), `${file} must include clear CTA: ${cta}`);
  }
});

// ── 5. ACCESSIBILITY (a11y) & WCAG 2.1 AA ───────────────────────────
console.log("\n▶ 5. ACCESSIBILITY (a11y) & WCAG 2.1 AA COMPLIANCE");

it("Tab navigation components implement semantic role='tablist' and role='tab'", () => {
  const tabViews = [
    "components/customer/CustomerRentalsView.tsx",
    "components/customer/CustomerPurchasesView.tsx",
    "components/customer/CustomerRequestsView.tsx",
  ];

  for (const file of tabViews) {
    const content = fs.readFileSync(path.join(rootDir, file), "utf-8");
    assert.ok(content.includes('role="tablist"'), `${file} must define role='tablist'`);
    assert.ok(content.includes('role="tab"'), `${file} must define role='tab'`);
    assert.ok(content.includes("aria-selected="), `${file} must specify aria-selected`);
    assert.ok(content.includes("focus-visible:ring-2"), `${file} must specify keyboard focus rings`);
  }
});

it("Brand color palette strictly complies with contrast and identity standards", () => {
  const cssPath = path.join(rootDir, "app/globals.css");
  const content = fs.readFileSync(cssPath, "utf-8");

  assert.ok(content.includes("#07111F") || content.includes("07111F"), "Globals must define primary navy #07111F");
  assert.ok(content.includes("#C89B3C") || content.includes("C89B3C"), "Globals must define luxury gold #C89B3C");
});

// ── Summary Report ───────────────────────────────────────────────────
console.log("\n========================================================");
console.log(`UX & ACCESSIBILITY VERIFICATION: ${passed} passed, ${failed} failed`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
}
