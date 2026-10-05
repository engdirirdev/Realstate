// ================================================================
// MODULE     : Property Type Specifications & Dynamic Schemas
// FILE       : lib/property-type-specs.ts
// DESCRIPTION: Definitions, field schemas, feature lists, and validation
//              rules for each distinct real estate property type.
// ================================================================

export type PropertyTypeCode =
  | "APARTMENT"
  | "HOUSE"
  | "VILLA"
  | "LAND"
  | "OFFICE"
  | "COMMERCIAL"
  | "SHOP"
  | "WAREHOUSE"
  | "OTHER";

export interface PropertyTypeMeta {
  code: PropertyTypeCode;
  label: string;
  category: "Residential" | "Commercial" | "Land" | "Industrial";
  description: string;
  iconName: string;
}

export const PROPERTY_TYPES: PropertyTypeMeta[] = [
  {
    code: "APARTMENT",
    label: "Apartment",
    category: "Residential",
    description: "Flats, multi-unit residential buildings, and penthouses",
    iconName: "Building2",
  },
  {
    code: "HOUSE",
    label: "House",
    category: "Residential",
    description: "Detached and semi-detached residential family homes",
    iconName: "Home",
  },
  {
    code: "VILLA",
    label: "Villa",
    category: "Residential",
    description: "Luxury private compounds, estates, and gated villas",
    iconName: "Castle",
  },
  {
    code: "LAND",
    label: "Land / Plot",
    category: "Land",
    description: "Residential, commercial, agricultural, and industrial plots",
    iconName: "Map",
  },
  {
    code: "OFFICE",
    label: "Office Space",
    category: "Commercial",
    description: "Corporate headquarters, business suites, and co-working",
    iconName: "Briefcase",
  },
  {
    code: "COMMERCIAL",
    label: "Commercial Property",
    category: "Commercial",
    description: "Commercial plazas, medical centers, and mixed-use hubs",
    iconName: "Building",
  },
  {
    code: "SHOP",
    label: "Retail Shop",
    category: "Commercial",
    description: "Street storefronts, market stalls, and shopping mall units",
    iconName: "Store",
  },
  {
    code: "WAREHOUSE",
    label: "Warehouse / Depot",
    category: "Industrial",
    description: "Logistics facilities, storage depots, and industrial sheds",
    iconName: "Warehouse",
  },
  {
    code: "OTHER",
    label: "Other Property",
    category: "Residential",
    description: "Specialized or multipurpose property assets",
    iconName: "Layers",
  },
];

// Pre-defined amenity checkboxes per property type
export const TYPE_AMENITIES: Record<PropertyTypeCode, string[]> = {
  APARTMENT: [
    "Elevator",
    "24/7 Security",
    "City Water Connection",
    "Mains Electricity",
    "Standby Generator",
    "Dedicated Parking",
    "Air Conditioning",
    "Balcony",
    "High-Speed Internet",
    "Water Tank / Reservoir",
    "CCTV Surveillance",
  ],
  HOUSE: [
    "Private Garden",
    "Perimeter Fence / Wall",
    "Security Guard Post",
    "City Water Connection",
    "Mains Electricity",
    "Standby Generator",
    "Car Garage / Parking",
    "Air Conditioning",
    "High-Speed Internet",
    "Water Reservoir / Tank",
    "Solar Energy Ready",
  ],
  VILLA: [
    "Private Swimming Pool",
    "Landscaped Garden",
    "Enclosed Multi-Car Garage",
    "High Security Perimeter Wall",
    "24/7 Private Security",
    "Heavy-Duty Generator",
    "City Water & Borehole",
    "3-Phase Electricity",
    "Central Air Conditioning",
    "High-Speed Fiber Internet",
    "Maid / Staff Quarters",
    "Dedicated Guest Room",
  ],
  LAND: [
    "City Water Access",
    "Mains Electricity Access",
    "Perimeter Wall / Fenced",
    "Direct Tarmac Road Access",
    "Corner Plot Position",
    "Surveyor Beacons In Place",
    "High Commercial Footfall",
    "Elevated Drainage / Flood-Free",
  ],
  OFFICE: [
    "High-Speed Fiber Internet",
    "24/7 Security & CCTV",
    "Standby Generator",
    "Elevator & Wheelchair Access",
    "Dedicated Employee Parking",
    "Central Air Conditioning",
    "Fire Suppression System",
    "Reception & Lobby Service",
    "City Water & Pantry",
  ],
  COMMERCIAL: [
    "High-Speed Internet",
    "24/7 Security & Patrols",
    "High-Capacity Generator",
    "Customer Parking Lot",
    "Elevators / Escalators",
    "Air Conditioning",
    "Fire Alarm & Sprinklers",
    "High Commercial Footfall",
    "3-Phase Industrial Power",
  ],
  SHOP: [
    "High Commercial Footfall",
    "Display Frontage Glass",
    "Security Rolling Shutter",
    "Air Conditioning",
    "Mains Electricity",
    "Customer Parking",
    "Private Bathroom",
    "Storage Mezzanine",
    "Water Connection",
  ],
  WAREHOUSE: [
    "3-Phase Heavy Duty Electricity",
    "Heavy Vehicle / Container Access",
    "24/7 Industrial Security",
    "Fire Hydrant & Safety System",
    "Dedicated Truck Loading Bays",
    "High Perimeter Security Fence",
    "Industrial Water Supply",
    "Onsite Administrative Office",
    "Concrete Heavy-Load Flooring",
  ],
  OTHER: [
    "24/7 Security",
    "Water Connection",
    "Electricity Connection",
    "Parking Available",
    "Standby Generator",
    "Air Conditioning",
  ],
};

/**
 * Validate dynamic form fields based on the selected Property Type
 */
export function validatePropertyTypeForm(
  type: PropertyTypeCode,
  values: {
    title?: string;
    price?: number | string;
    city?: string;
    description?: string;
    area?: number | string;
    bedrooms?: number | string;
    bathrooms?: number | string;
    imageUrl?: string;
    typeDetails?: Record<string, any>;
  }
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Common Validations
  if (!values.title || !String(values.title).trim()) {
    errors.title = "Property Title is required.";
  }
  if (!values.price || Number(values.price) <= 0) {
    errors.price = "A valid listing price is required.";
  }
  if (!values.city || !String(values.city).trim()) {
    errors.city = "City location is required.";
  }
  if (!values.description || !String(values.description).trim()) {
    errors.description = "Property description is required.";
  }
  if (!values.imageUrl || !String(values.imageUrl).trim()) {
    errors.imageUrl = "A primary property image is required.";
  }

  const td = values.typeDetails || {};

  // Type-specific field validations
  switch (type) {
    case "LAND":
      if (!td.landArea && !values.area) {
        errors.landArea = "Land area (m²) is required.";
      }
      if (!td.landUse) {
        errors.landUse = "Please select the designated land use / purpose.";
      }
      if (!td.titleDeedStatus) {
        errors.titleDeedStatus = "Ownership / Title Deed status is required.";
      }
      break;

    case "APARTMENT":
      if (!values.bedrooms || Number(values.bedrooms) < 0) {
        errors.bedrooms = "Number of bedrooms is required.";
      }
      if (!values.bathrooms || Number(values.bathrooms) < 0) {
        errors.bathrooms = "Number of bathrooms is required.";
      }
      if (!values.area || Number(values.area) <= 0) {
        errors.area = "Apartment living area (m²) is required.";
      }
      break;

    case "HOUSE":
      if (!values.bedrooms || Number(values.bedrooms) < 0) {
        errors.bedrooms = "Number of bedrooms is required.";
      }
      if (!values.bathrooms || Number(values.bathrooms) < 0) {
        errors.bathrooms = "Number of bathrooms is required.";
      }
      if (!values.area || Number(values.area) <= 0) {
        errors.area = "Built area (m²) is required.";
      }
      break;

    case "VILLA":
      if (!values.bedrooms || Number(values.bedrooms) < 0) {
        errors.bedrooms = "Number of bedrooms is required.";
      }
      if (!values.bathrooms || Number(values.bathrooms) < 0) {
        errors.bathrooms = "Number of bathrooms is required.";
      }
      if (!values.area || Number(values.area) <= 0) {
        errors.area = "Villa building area (m²) is required.";
      }
      break;

    case "SHOP":
      if (!td.shopArea && !values.area) {
        errors.shopArea = "Shop retail area (m²) is required.";
      }
      break;

    case "WAREHOUSE":
      if (!td.warehouseArea && !values.area) {
        errors.warehouseArea = "Warehouse floor area (m²) is required.";
      }
      break;

    case "OFFICE":
    case "COMMERCIAL":
      if (!td.floorArea && !values.area) {
        errors.floorArea = "Usable floor area (m²) is required.";
      }
      break;

    default:
      if (!values.area || Number(values.area) <= 0) {
        errors.area = "Property area (m²) is required.";
      }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Format type-specific details into human-readable specs list
 */
export function getTypeSpecificSpecsList(
  type: string,
  typeDetails: Record<string, any> = {},
  common: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    parking?: number;
    isFurnished?: boolean;
    lotSize?: number | null;
    yearBuilt?: number | null;
  } = {}
): { label: string; value: string; isHighlight?: boolean }[] {
  const specs: { label: string; value: string; isHighlight?: boolean }[] = [];
  const upperType = (type || "").toUpperCase();

  switch (upperType) {
    case "LAND":
      specs.push({
        label: "Land Area",
        value: `${typeDetails.landArea || common.area || 0} m²`,
        isHighlight: true,
      });
      if (typeDetails.landUse) {
        specs.push({ label: "Land Use / Purpose", value: String(typeDetails.landUse), isHighlight: true });
      }
      if (typeDetails.zoning) {
        specs.push({ label: "Zoning Classification", value: String(typeDetails.zoning) });
      }
      if (typeDetails.landShape) {
        specs.push({ label: "Plot Shape", value: String(typeDetails.landShape) });
      }
      if (typeDetails.roadAccess !== undefined) {
        specs.push({
          label: "Road Access",
          value: typeDetails.roadAccess ? `Yes (${typeDetails.roadWidth ? typeDetails.roadWidth + "m wide" : "Direct access"})` : "No direct road",
        });
      }
      if (typeDetails.ownershipType) {
        specs.push({ label: "Ownership Type", value: String(typeDetails.ownershipType) });
      }
      if (typeDetails.titleDeedStatus) {
        specs.push({ label: "Title Deed Status", value: String(typeDetails.titleDeedStatus), isHighlight: true });
      }
      if (typeDetails.developmentStatus) {
        specs.push({ label: "Development Status", value: String(typeDetails.developmentStatus) });
      }
      if (typeDetails.boundary) {
        specs.push({ label: "Boundary / Fence", value: String(typeDetails.boundary) });
      }
      if (typeDetails.isCornerPlot !== undefined) {
        specs.push({ label: "Corner Plot", value: typeDetails.isCornerPlot ? "Yes (Premium Corner)" : "No" });
      }
      if (typeDetails.waterAvailability) {
        specs.push({ label: "Water Availability", value: String(typeDetails.waterAvailability) });
      }
      if (typeDetails.electricityAvailability) {
        specs.push({ label: "Electricity Availability", value: String(typeDetails.electricityAvailability) });
      }
      if (typeDetails.soilType) {
        specs.push({ label: "Soil Type", value: String(typeDetails.soilType) });
      }
      break;

    case "APARTMENT":
      specs.push({ label: "Living Area", value: `${common.area || 0} m²`, isHighlight: true });
      specs.push({ label: "Bedrooms", value: `${common.bedrooms ?? 0} Beds`, isHighlight: true });
      specs.push({ label: "Bathrooms", value: `${common.bathrooms ?? 0} Baths` });
      if (typeDetails.floorNumber) {
        specs.push({
          label: "Floor Position",
          value: `Floor ${typeDetails.floorNumber}${typeDetails.totalFloors ? ` of ${typeDetails.totalFloors}` : ""}`,
        });
      }
      if (typeDetails.livingRooms) {
        specs.push({ label: "Living Rooms", value: `${typeDetails.livingRooms}` });
      }
      if (common.parking) {
        specs.push({ label: "Parking Spaces", value: `${common.parking} Dedicated` });
      }
      specs.push({ label: "Furnished Status", value: common.isFurnished ? "Fully Furnished" : "Unfurnished" });
      if (typeDetails.hasBalcony !== undefined) {
        specs.push({ label: "Balcony", value: typeDetails.hasBalcony ? "Yes (Private Balcony)" : "No" });
      }
      if (typeDetails.hasElevator !== undefined) {
        specs.push({ label: "Building Elevator", value: typeDetails.hasElevator ? "Available" : "Stairs Only" });
      }
      if (common.yearBuilt) {
        specs.push({ label: "Year Built", value: `${common.yearBuilt}` });
      }
      break;

    case "VILLA":
      specs.push({ label: "Building Area", value: `${common.area || 0} m²`, isHighlight: true });
      if (common.lotSize || typeDetails.compoundSize) {
        specs.push({
          label: "Compound / Land Size",
          value: `${common.lotSize || typeDetails.compoundSize} m²`,
          isHighlight: true,
        });
      }
      specs.push({ label: "Bedrooms", value: `${common.bedrooms ?? 0} Suites`, isHighlight: true });
      specs.push({ label: "Bathrooms", value: `${common.bathrooms ?? 0} Baths` });
      if (typeDetails.floors) {
        specs.push({ label: "Building Floors", value: `${typeDetails.floors} Storeys` });
      }
      if (typeDetails.livingRooms) {
        specs.push({ label: "Salons & Lounges", value: `${typeDetails.livingRooms}` });
      }
      if (common.parking) {
        specs.push({ label: "Garage / Parking", value: `${common.parking} Cars` });
      }
      specs.push({ label: "Furnished Status", value: common.isFurnished ? "Furnished" : "Unfurnished" });
      if (typeDetails.hasPool) {
        specs.push({ label: "Swimming Pool", value: "Private Pool", isHighlight: true });
      }
      if (typeDetails.hasMaidRoom) {
        specs.push({ label: "Maid / Staff Room", value: "Included" });
      }
      if (typeDetails.hasGuestRoom) {
        specs.push({ label: "Guest Majlis", value: "Included" });
      }
      if (common.yearBuilt) {
        specs.push({ label: "Year Built", value: `${common.yearBuilt}` });
      }
      break;

    case "HOUSE":
      specs.push({ label: "Living Area", value: `${common.area || 0} m²`, isHighlight: true });
      if (common.lotSize || typeDetails.compoundSize) {
        specs.push({
          label: "Compound Size",
          value: `${common.lotSize || typeDetails.compoundSize} m²`,
        });
      }
      specs.push({ label: "Bedrooms", value: `${common.bedrooms ?? 0} Beds`, isHighlight: true });
      specs.push({ label: "Bathrooms", value: `${common.bathrooms ?? 0} Baths` });
      if (typeDetails.floors) {
        specs.push({ label: "Number of Floors", value: `${typeDetails.floors} Floors` });
      }
      if (common.parking) {
        specs.push({ label: "Parking", value: `${common.parking} Spaces` });
      }
      specs.push({ label: "Furnished", value: common.isFurnished ? "Furnished" : "Unfurnished" });
      if (common.yearBuilt) {
        specs.push({ label: "Year Built", value: `${common.yearBuilt}` });
      }
      break;

    case "OFFICE":
    case "COMMERCIAL":
      specs.push({
        label: "Floor Area",
        value: `${typeDetails.floorArea || common.area || 0} m²`,
        isHighlight: true,
      });
      if (typeDetails.commercialType) {
        specs.push({ label: "Commercial Type", value: String(typeDetails.commercialType), isHighlight: true });
      }
      if (typeDetails.floors) {
        specs.push({ label: "Floors / Levels", value: `${typeDetails.floors}` });
      }
      if (typeDetails.meetingRooms) {
        specs.push({ label: "Meeting Rooms", value: `${typeDetails.meetingRooms} Rooms` });
      }
      if (common.bathrooms) {
        specs.push({ label: "Restrooms", value: `${common.bathrooms}` });
      }
      if (common.parking) {
        specs.push({ label: "Dedicated Parking", value: `${common.parking} Spaces` });
      }
      if (typeDetails.suitableBusiness) {
        specs.push({ label: "Suitable For", value: String(typeDetails.suitableBusiness) });
      }
      if (typeDetails.fitoutStatus) {
        specs.push({ label: "Fit-out Status", value: String(typeDetails.fitoutStatus) });
      }
      break;

    case "SHOP":
      specs.push({
        label: "Retail Shop Area",
        value: `${typeDetails.shopArea || common.area || 0} m²`,
        isHighlight: true,
      });
      if (typeDetails.frontageWidth) {
        specs.push({ label: "Frontage Width", value: `${typeDetails.frontageWidth} meters`, isHighlight: true });
      }
      if (typeDetails.floorLevel) {
        specs.push({ label: "Floor Level", value: String(typeDetails.floorLevel) });
      }
      if (typeDetails.storageArea) {
        specs.push({ label: "Storage Space", value: `${typeDetails.storageArea} m²` });
      }
      if (common.bathrooms) {
        specs.push({ label: "Bathrooms", value: `${common.bathrooms}` });
      }
      if (typeDetails.suitableBusiness) {
        specs.push({ label: "Suitable Retail Type", value: String(typeDetails.suitableBusiness) });
      }
      break;

    case "WAREHOUSE":
      specs.push({
        label: "Warehouse Floor Area",
        value: `${typeDetails.warehouseArea || common.area || 0} m²`,
        isHighlight: true,
      });
      if (typeDetails.ceilingHeight) {
        specs.push({ label: "Ceiling Clear Height", value: `${typeDetails.ceilingHeight} meters`, isHighlight: true });
      }
      if (typeDetails.storageCapacity) {
        specs.push({ label: "Storage Capacity", value: String(typeDetails.storageCapacity) });
      }
      if (common.lotSize || typeDetails.compoundSize) {
        specs.push({ label: "Total Compound Size", value: `${common.lotSize || typeDetails.compoundSize} m²` });
      }
      if (typeDetails.officeArea) {
        specs.push({ label: "Admin Office Area", value: `${typeDetails.officeArea} m²` });
      }
      if (typeDetails.loadingBays) {
        specs.push({ label: "Loading / Dock Bays", value: String(typeDetails.loadingBays) });
      }
      if (typeDetails.truckAccess) {
        specs.push({ label: "Truck / Trailer Access", value: String(typeDetails.truckAccess) });
      }
      if (common.bathrooms) {
        specs.push({ label: "Restrooms", value: `${common.bathrooms}` });
      }
      break;

    default:
      specs.push({ label: "Property Area", value: `${common.area || 0} m²`, isHighlight: true });
      if (common.bedrooms) specs.push({ label: "Bedrooms", value: `${common.bedrooms}` });
      if (common.bathrooms) specs.push({ label: "Bathrooms", value: `${common.bathrooms}` });
      if (common.parking) specs.push({ label: "Parking", value: `${common.parking}` });
      if (common.isFurnished) specs.push({ label: "Furnished", value: "Yes" });
      break;
  }

  return specs;
}
