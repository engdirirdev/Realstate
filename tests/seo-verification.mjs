/**
 * Comprehensive Automated Verification Suite for SEO & Structured Data
 * Platform: Kiro-Maal Luxury Real Estate
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sitemap from "../app/sitemap.ts";
import robots from "../app/robots.ts";
import manifest from "../app/manifest.ts";
import {
  generateRealEstateAgentSchema,
  generateWebSiteSchema,
  generatePropertySchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "../lib/seo-schema.ts";

const getSitemap = typeof sitemap === "function" ? sitemap : (sitemap.default || sitemap);
const getRobots = typeof robots === "function" ? robots : (robots.default || robots);
const getManifest = typeof manifest === "function" ? manifest : (manifest.default || manifest);

console.log("------------------------------------------------------------------");
console.log("🌐 STARTING SEARCH ENGINE OPTIMIZATION (SEO) VERIFICATION SUITE");
console.log("------------------------------------------------------------------\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// ==========================================
// 1. Metadata, Viewport & Open Graph Tests
// ==========================================
console.log("🔹 1. Root & Public Route Metadata Verification");

test("Root layout defines brand title template, canonical URL, and themeColor (#07111F)", () => {
  const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
  assert(fs.existsSync(layoutPath), "app/layout.tsx exists");
  const layoutCode = fs.readFileSync(layoutPath, "utf8");

  assert(layoutCode.includes('themeColor: "#07111F"'), "Viewport specifies brand theme-color #07111F");
  assert(layoutCode.includes("template:"), "Title template configured");
  assert(layoutCode.includes("Kiro-Maal Real Estate"), "Title includes Kiro-Maal Real Estate");
  assert(layoutCode.includes("canonical:"), "Canonical link configured");
  assert(layoutCode.includes("openGraph:"), "OpenGraph configured");
  assert(layoutCode.includes("siteName: \"Kiro-Maal Luxury Real Estate\""), "OpenGraph siteName configured");
  assert(layoutCode.includes("summary_large_image"), "Twitter card configured");
  assert(layoutCode.includes("manifest: \"/manifest.webmanifest\""), "Manifest link configured");
});

test("Public pages specify dedicated titles, meta descriptions, and canonical URLs", () => {
  const pageFiles = [
    { file: path.join("app", "(public)", "page.tsx"), canonical: '"/"' },
    { file: path.join("app", "(public)", "properties", "page.tsx"), canonical: '"/properties"' },
    { file: path.join("app", "(public)", "services", "page.tsx"), canonical: '"/services"' },
    { file: path.join("app", "(public)", "about", "page.tsx"), canonical: '"/about"' },
    { file: path.join("app", "(public)", "contact", "layout.tsx"), canonical: '"/contact"' },
    { file: path.join("app", "(public)", "price-prediction", "layout.tsx"), canonical: '"/price-prediction"' },
    { file: path.join("app", "(public)", "ai-assistant", "layout.tsx"), canonical: '"/ai-assistant"' },
    { file: path.join("app", "(public)", "properties", "compare", "page.tsx"), canonical: '"/properties/compare"' },
  ];

  for (const item of pageFiles) {
    const fullPath = path.join(process.cwd(), item.file);
    assert(fs.existsSync(fullPath), `File exists: ${item.file}`);
    const code = fs.readFileSync(fullPath, "utf8");

    assert(code.includes("export const metadata"), `Exports metadata in ${item.file}`);
    assert(code.includes("title:"), `Contains title in ${item.file}`);
    assert(code.includes("description:"), `Contains description in ${item.file}`);
    assert(code.includes(item.canonical), `Contains canonical ${item.canonical} in ${item.file}`);
    assert(code.includes("openGraph:"), `Contains openGraph in ${item.file}`);
  }
});

test("Dynamic property detail page implements generateMetadata for dynamic SEO", () => {
  const detailPath = path.join(process.cwd(), "app", "(public)", "properties", "[id]", "page.tsx");
  assert(fs.existsSync(detailPath));
  const code = fs.readFileSync(detailPath, "utf8");

  assert(code.includes("export async function generateMetadata"), "Implements dynamic generateMetadata");
  assert(code.includes("canonical: `/properties/${id}`"), "Sets dynamic canonical URL");
  assert(code.includes("openGraph:"), "Generates dynamic OpenGraph metadata");
  assert(code.includes("summary_large_image"), "Sets dynamic Twitter card");
});

// ==========================================
// 2. Dynamic Sitemap Verification
// ==========================================
console.log("\n🔹 2. Dynamic Sitemap Engine Verification");

await asyncTest("sitemap() generates valid XML sitemap with static and dynamic property routes", async () => {
  const routes = await getSitemap();
  assert(Array.isArray(routes));
  assert(routes.length >= 15, `Expected at least 15 sitemap entries, received ${routes.length}`);

  const urls = routes.map((r) => r.url);
  assert(urls.some((u) => u.endsWith("/properties")));
  assert(urls.some((u) => u.endsWith("/services")));
  assert(urls.some((u) => u.endsWith("/about")));
  assert(urls.some((u) => u.endsWith("/contact")));
  assert(urls.some((u) => u.endsWith("/price-prediction")));
  assert(urls.some((u) => u.endsWith("/ai-assistant")));
  assert(urls.some((u) => u.includes("city=Mogadishu")));
  assert(urls.some((u) => u.includes("city=Hargeisa")));
  assert(urls.some((u) => u.includes("listingType=FOR_SALE")));

  // Verify route properties
  for (const route of routes) {
    assert(route.url.startsWith("http"));
    assert(route.lastModified);
    assert(route.priority >= 0.5 && route.priority <= 1.0);
    assert(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].includes(route.changeFrequency));
  }
});

// ==========================================
// 3. Robots.txt Crawler Directives
// ==========================================
console.log("\n🔹 3. Robots.txt Crawler Directives Verification");

test("robots() enforces private route disallow rules and references sitemap", () => {
  const config = getRobots();
  assert(config.sitemap);
  assert(config.host);
  assert(Array.isArray(config.rules));

  const defaultRule = config.rules.find((r) => r.userAgent === "*");
  assert(defaultRule, "Missing default wildcard rule");
  assert.equal(defaultRule.allow, "/");

  const disallowList = Array.isArray(defaultRule.disallow) ? defaultRule.disallow : [defaultRule.disallow];
  assert(disallowList.includes("/admin/"));
  assert(disallowList.includes("/dashboard/"));
  assert(disallowList.includes("/customer/"));
  assert(disallowList.includes("/api/"));
  assert(disallowList.includes("/receipt/"));
  assert(disallowList.includes("/login?*"));
  assert(disallowList.includes("/register?*"));

  // Verify dedicated AI crawler rules
  const gptBot = config.rules.find((r) => r.userAgent === "GPTBot");
  assert(gptBot, "Missing GPTBot crawler rule");
  const claudeBot = config.rules.find((r) => r.userAgent === "ClaudeBot");
  assert(claudeBot, "Missing ClaudeBot crawler rule");
});

// ==========================================
// 4. Schema.org Structured Data (JSON-LD)
// ==========================================
console.log("\n🔹 4. Schema.org Structured Data & Rich Results");

test("generateRealEstateAgentSchema creates valid Organization & LocalBusiness schema", () => {
  const schema = generateRealEstateAgentSchema();
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "RealEstateAgent");
  assert.equal(schema.name, "Kiro-Maal Real Estate");
  assert.equal(schema.currenciesAccepted, "USD");
  assert(schema.address);
  assert.equal(schema.address.addressLocality, "Mogadishu");
  assert.equal(schema.address.addressCountry, "SO");
  assert(schema.geo);
  assert.equal(schema.geo.latitude, "2.046934");
  assert(Array.isArray(schema.sameAs));
});

test("generateWebSiteSchema provides Sitelinks SearchAction target", () => {
  const schema = generateWebSiteSchema();
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "WebSite");
  assert(schema.potentialAction);
  assert.equal(schema.potentialAction["@type"], "SearchAction");
  assert(schema.potentialAction.target.urlTemplate.includes("/properties?search="));
});

test("generatePropertySchema formats RealEstateListing with Residence offers and coordinates", () => {
  const dummyProp = {
    id: "prop-luxury-villa-1",
    title: "Oceanfront Luxury Villa in Mogadishu",
    description: "Exclusive 5-bedroom villa with ocean views and private security.",
    price: 350000,
    type: "VILLA",
    city: "Mogadishu",
    address: "Lido Beach Road, Abdiaziz District",
    bedrooms: 5,
    bathrooms: 4,
    areaSqFt: 4500,
    images: [{ url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9" }],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-02-01"),
  };

  const schema = generatePropertySchema(dummyProp);
  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@type"], "RealEstateListing");
  assert.equal(schema.name, dummyProp.title);
  assert(schema.mainEntity);
  assert.equal(schema.mainEntity["@type"], "SingleFamilyResidence");
  assert.equal(schema.mainEntity.numberOfBedrooms, 5);
  assert.equal(schema.mainEntity.numberOfBathroomsTotal, 4);
  assert(schema.mainEntity.offers);
  assert.equal(schema.mainEntity.offers.price, 350000);
  assert.equal(schema.mainEntity.offers.priceCurrency, "USD");
  assert.equal(schema.mainEntity.offers.availability, "https://schema.org/InStock");
});

test("generateBreadcrumbSchema formats hierarchical position list", () => {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Properties", url: "/properties" },
    { name: "Oceanfront Villa", url: "/properties/prop-123" },
  ]);

  assert.equal(breadcrumb["@context"], "https://schema.org");
  assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.equal(breadcrumb.itemListElement[0].position, 1);
  assert.equal(breadcrumb.itemListElement[0].name, "Home");
  assert.equal(breadcrumb.itemListElement[2].position, 3);
  assert.equal(breadcrumb.itemListElement[2].name, "Oceanfront Villa");
});

test("generateFAQSchema formats Question and Answer rich entities", () => {
  const faqSchema = generateFAQSchema([
    {
      question: "Can Somali diaspora members invest remotely?",
      answer: "Yes, Kiro-Maal supports verified remote title deeds and escrow payments.",
    },
  ]);

  assert.equal(faqSchema["@context"], "https://schema.org");
  assert.equal(faqSchema["@type"], "FAQPage");
  assert.equal(faqSchema.mainEntity.length, 1);
  assert.equal(faqSchema.mainEntity[0]["@type"], "Question");
  assert.equal(faqSchema.mainEntity[0].name, "Can Somali diaspora members invest remotely?");
  assert.equal(faqSchema.mainEntity[0].acceptedAnswer["@type"], "Answer");
  assert(faqSchema.mainEntity[0].acceptedAnswer.text.includes("remote title deeds"));
});

// ==========================================
// 5. Web App Manifest
// ==========================================
console.log("\n🔹 5. Web App Manifest Verification");

test("manifest() provides PWA specification with brand theme colors and icons", () => {
  const pwaManifest = getManifest();
  assert.equal(pwaManifest.name, "Kiro-Maal Luxury Real Estate Somalia");
  assert.equal(pwaManifest.short_name, "Kiro-Maal");
  assert.equal(pwaManifest.theme_color, "#07111F");
  assert.equal(pwaManifest.background_color, "#07111F");
  assert.equal(pwaManifest.display, "standalone");
  assert(Array.isArray(pwaManifest.icons));
  assert(pwaManifest.icons.length >= 2);
});

console.log("\n------------------------------------------------------------------");
console.log(`🎉 ALL ${passed}/${total} SEO VERIFICATION TESTS PASSED SUCCESSFULLY!`);
console.log("------------------------------------------------------------------\n");
