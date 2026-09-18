import { PrismaClient, PropertyType, PropertyStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const cities = ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Garowe", "Baydhabo", "Berbera"];
const propertyTypes: PropertyType[] = [
  "HOUSE", "APARTMENT", "VILLA", "OFFICE", "LAND", "COMMERCIAL", "TOWNHOUSE", "STUDIO",
];

const propertyImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePropertyData(index: number) {
  const type = propertyTypes[index % propertyTypes.length];
  const city = cities[index % cities.length];
  const bedrooms = type === "STUDIO" || type === "LAND" ? 1 : (index % 4) + 1;
  const bathrooms = Math.max(1, bedrooms - 1);
  const area = 50 + (index % 10) * 30;
  const basePrice = type === "VILLA" ? 120000 : type === "HOUSE" ? 65000 : type === "LAND" ? 25000 : 45000;
  const price = basePrice + (index % 7) * 5000;

  const titles: Record<PropertyType, string[]> = {
    HOUSE: [
      `Spacious Modern House in ${city}`,
      `Family Home near City Center, ${city}`,
      `Beautiful Gated House in ${city}`,
    ],
    APARTMENT: [
      `Luxury Apartment in ${city}`,
      `Modern 2-Bedroom Apartment, ${city}`,
      `High-Rise Apartment with Ocean View, ${city}`,
    ],
    VILLA: [
      `Exclusive Villa with Private Yard, ${city}`,
      `Modern Luxury Villa in ${city}`,
      `Grand Estate Villa, ${city}`,
    ],
    OFFICE: [
      `Prime Office Space in ${city}`,
      `Commercial Office Building, ${city}`,
      `Modern Business Office Suite, ${city}`,
    ],
    LAND: [
      `Residential Land Plot for Sale, ${city}`,
      `Commercial Plot in Prime ${city} Area`,
      `Development Land in ${city}`,
    ],
    COMMERCIAL: [
      `Retail Shop Space in Busy ${city} Market`,
      `Commercial Building, ${city}`,
      `Warehouse Space in ${city}`,
    ],
    TOWNHOUSE: [
      `Modern Townhouse in ${city}`,
      `Executive Townhouse Estate, ${city}`,
    ],
    STUDIO: [
      `Cozy Studio Apartment in ${city}`,
      `Modern Compact Studio, ${city}`,
    ],
  };

  const titleList = titles[type] || [`Property in ${city}`];
  const title = titleList[index % titleList.length];

  return {
    title,
    description: `A prime ${type.toLowerCase()} property located in the heart of ${city}. Features ${bedrooms} bedrooms, ${bathrooms} bathrooms, and ${area}m² total area. Complete with high-speed internet, secure compound walls, 24/7 water supply, and backup generator connection.`,
    price,
    location: `${city} Central`,
    city,
    address: `Street ${index + 1}, ${city}`,
    type,
    status: (index % 5 === 0 ? "APPROVED" : "APPROVED") as PropertyStatus,
    bedrooms,
    bathrooms,
    area,
    yearBuilt: 2018 + (index % 6),
    amenities: JSON.stringify(["Generator Backup", "24/7 Water Supply", "Compound Wall", "Parking Space", "Solar Power"]),
    isFeatured: index < 6,
    images: {
      url: propertyImages[index % propertyImages.length],
      altText: title,
    },
  };
}

async function main() {
  console.log("🌱 Wiping database and seeding clean data...");

  // ─── CLEAR ALL TABLES ──────────────────────────────
  await prisma.review.deleteMany();
  await prisma.propertyDocument.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.pricePrediction.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ All existing data wiped.\n");

  // ─── 1. CREATE ADMIN (SOMALI) ──────────────────────
  console.log("👤 Creating 1 Admin (Somali)...");
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Cabdullahi Axmed",
      email: "admin@realestate.so",
      phone: "+252615000001",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
      preferences: { create: {} },
    },
  });
  console.log(`   ✅ Admin: ${admin.name} (${admin.email}) / Admin@123456\n`);

  // ─── 2. CREATE MANAGER (SOMALI) ────────────────────
  console.log("🏢 Creating 1 Manager / Agent (Somali)...");
  const managerPassword = await bcrypt.hash("Manager@123456", 12);
  const manager = await prisma.user.create({
    data: {
      name: "Jaamac Maxamed",
      email: "manager@realestate.so",
      phone: "+252615000002",
      password: managerPassword,
      role: "USER",
      isActive: true,
      preferences: { create: {} },
    },
  });
  console.log(`   ✅ Manager: ${manager.name} (${manager.email}) / Manager@123456\n`);

  // ─── 3. CREATE CUSTOMER (SOMALI) ───────────────────
  console.log("👥 Creating 1 Customer (Somali)...");
  const customerPassword = await bcrypt.hash("Customer@123456", 12);
  const customer = await prisma.user.create({
    data: {
      name: "Aamina Xasan",
      email: "customer@realestate.so",
      phone: "+252615000003",
      password: customerPassword,
      role: "CUSTOMER",
      isActive: true,
      preferences: {
        create: {
          preferredLocation: "Mogadishu",
          minBudget: 20000,
          maxBudget: 100000,
          preferredType: "HOUSE",
          preferredBedrooms: 3,
        },
      },
      notifications: {
        create: {
          type: "WELCOME",
          title: "Welcome to AI Real Estate! 🏠",
          message: "Ku soo dhawoow Aamina Xasan! Browse verified Somali properties and get instant AI recommendations.",
        },
      },
    },
  });
  console.log(`   ✅ Customer: ${customer.name} (${customer.email}) / Customer@123456\n`);

  // ─── CREATE PROPERTIES (ASSIGNED TO SOMALI MANAGER) ──
  console.log("🏠 Creating 30 verified properties for Somali Manager...");
  const createdProperties = [];
  for (let i = 0; i < 30; i++) {
    const data = generatePropertyData(i);
    const status: PropertyStatus = i === 2 ? "REJECTED" : i === 3 ? "PENDING" : "APPROVED";
    const rejectionReason = i === 2 ? "Low resolution primary photo. Please upload high resolution property photos." : null;

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        location: data.location,
        city: data.city,
        address: data.address,
        type: data.type,
        status,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        yearBuilt: data.yearBuilt,
        amenities: data.amenities,
        isFeatured: data.isFeatured,
        managerId: manager.id,
        rejectionReason,
        images: {
          create: [
            { url: data.images.url, altText: data.images.altText, isPrimary: true, order: 0 },
            { url: randomFrom(propertyImages), altText: `${data.title} - View 2`, isPrimary: false, order: 1 },
          ],
        },
      },
    });
    createdProperties.push(property);
  }
  console.log("   ✅ 30 properties created under Manager Jaamac Maxamed.\n");

  // ─── CREATE CUSTOMER ACTIVITIES (INQUIRIES, BOOKINGS, PAYMENTS) ──
  console.log("💬 Creating sample inquiries, bookings, and payments...");
  const sampleProp = createdProperties[0];
  const sampleProp2 = createdProperties[1];

  // Inquiries
  await prisma.inquiry.create({
    data: {
      propertyId: sampleProp.id,
      customerId: customer.id,
      managerId: manager.id,
      subject: "Inquiry regarding move-in date & water supply",
      message: "Maxaa yeelay? Hi Jaamac, I am interested in this house. Is 24/7 backup water included?",
      response: "Asc Aamina! Yes, 24/7 backup water and generator connections are completely installed.",
      status: "RESPONDED",
    },
  });

  // Favorite
  await prisma.favorite.create({
    data: { userId: customer.id, propertyId: sampleProp.id },
  });
  await prisma.favorite.create({
    data: { userId: customer.id, propertyId: sampleProp2.id },
  });

  // Booking & Payment
  const booking = await prisma.booking.create({
    data: {
      propertyId: sampleProp.id,
      customerId: customer.id,
      managerId: manager.id,
      totalPrice: sampleProp.price,
      status: "CONFIRMED",
      notes: "Customer requested weekend viewing session.",
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      propertyId: sampleProp.id,
      customerId: customer.id,
      managerId: manager.id,
      amount: sampleProp.price,
      currency: "USD",
      paymentMethod: "DEMO / SANDBOX",
      status: "PAID",
      transactionRef: `TXN-SOMALI-${Date.now()}`,
      receiptUrl: "/customer/payments",
    },
  });

  // Reviews
  await prisma.review.create({
    data: {
      propertyId: sampleProp.id,
      userId: customer.id,
      rating: 5,
      comment: "Waafaqsan! Excellent compound with 24/7 security and clean water supply. Highly recommended!",
    },
  });

  // Documents
  await prisma.propertyDocument.create({
    data: {
      propertyId: sampleProp.id,
      title: "Property Deed Certificate",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileType: "PDF",
    },
  });

  // Categories & Locations
  await prisma.category.createMany({
    data: [
      { name: "Residential Houses", slug: "residential-houses", description: "Family homes and villas" },
      { name: "Luxury Apartments", slug: "luxury-apartments", description: "High-rise modern apartments" },
      { name: "Commercial & Office", slug: "commercial-office", description: "Office space, retail shops, and warehouses" },
      { name: "Land Plots", slug: "land-plots", description: "Plots ready for residential/commercial building" },
    ],
  });

  await prisma.location.createMany({
    data: [
      { city: "Mogadishu", region: "Banaadir", country: "Somalia" },
      { city: "Hargeisa", region: "Maroodi Jeex", country: "Somalia" },
      { city: "Bosaso", region: "Bari", country: "Somalia" },
      { city: "Garowe", region: "Nugaal", country: "Somalia" },
      { city: "Kismayo", region: "Jubbada Hoose", country: "Somalia" },
    ],
  });

  // System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: "site_name", value: "AI RealEstate Somalia" },
      { key: "contact_email", value: "support@realestate.so" },
      { key: "currency", value: "USD" },
      { key: "auto_approve_properties", value: "false" },
    ],
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "DATABASE_SEEDED",
      details: "Database reset and seeded with initial Somali demonstration records.",
      ipAddress: "127.0.0.1",
    },
  });
  console.log("   ✅ Inquiries, Bookings, Payments, Reviews, Documents, Categories, Settings, and Audit Logs created.\n");

  console.log("═══════════════════════════════════════════");
  console.log("✅ DATABASE CLEANED & RE-SEEDED SUCCESSFULLY!");
  console.log("═══════════════════════════════════════════");
  console.log("1. ADMIN            : Cabdullahi Axmed (admin@realestate.so)    / Admin@123456");
  console.log("2. USER / MANAGER   : Jaamac Maxamed   (manager@realestate.so)  / Manager@123456");
  console.log("3. CUSTOMER         : Aamina Xasan     (customer@realestate.so) / Customer@123456");
  console.log("═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
