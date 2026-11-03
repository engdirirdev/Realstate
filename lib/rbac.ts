/**
 * ================================================================
 * ENTERPRISE ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS MATRIX
 * ================================================================
 * Defines system roles, domain-specific granular permissions,
 * role hierarchies, and universal authorization helpers for
 * API route handlers, Server Actions, and UI components.
 */

export type Role = "ADMIN" | "USER" | "CUSTOMER" | "PUBLIC";

/**
 * Granular Domain Permissions
 */
export const PERMISSIONS = {
  // Properties
  PROPERTY_VIEW_PUBLIC: "property:view_public",
  PROPERTY_VIEW_ALL: "property:view_all",
  PROPERTY_CREATE: "property:create",
  PROPERTY_EDIT_OWN: "property:edit_own",
  PROPERTY_EDIT_ANY: "property:edit_any",
  PROPERTY_DELETE_OWN: "property:delete_own",
  PROPERTY_DELETE_ANY: "property:delete_any",
  PROPERTY_APPROVE: "property:approve",
  PROPERTY_FEATURE: "property:feature",
  PROPERTY_EXPORT: "property:export",

  // Bookings & Viewings
  BOOKING_CREATE: "booking:create",
  BOOKING_VIEW_OWN: "booking:view_own",
  BOOKING_VIEW_ALL: "booking:view_all",
  BOOKING_MANAGE_OWN: "booking:manage_own",
  BOOKING_MANAGE_ALL: "booking:manage_all",

  // Inquiries & Leads
  INQUIRY_CREATE: "inquiry:create",
  INQUIRY_VIEW_OWN: "inquiry:view_own",
  INQUIRY_VIEW_ALL: "inquiry:view_all",
  INQUIRY_REPLY: "inquiry:reply",

  // Financials, Transactions & Direct Rentals
  PAYMENT_CREATE: "payment:create",
  PAYMENT_VIEW_OWN: "payment:view_own",
  PAYMENT_VIEW_ALL: "payment:view_all",
  PAYMENT_MANAGE: "payment:manage",
  FINANCIAL_ANALYTICS: "financial:analytics",
  DIRECT_RENTAL_CREATE: "rental:direct_create",

  // User Administration & Auditing
  USER_VIEW_ALL: "user:view_all",
  USER_MANAGE: "user:manage",
  ROLE_ASSIGN: "role:assign",
  AUDIT_LOG_VIEW: "audit:view",
  SYSTEM_SETTINGS: "settings:manage",

  // Reviews
  REVIEW_CREATE: "review:create",
  REVIEW_MODERATE: "review:moderate",

  // AI & Advanced Tools
  AI_CHAT: "ai:chat",
  AI_PRICE_PREDICTION: "ai:price_prediction",
  AI_GENERATE_DESCRIPTION: "ai:generate_description",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role Permissions Matrix
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    PERMISSIONS.PROPERTY_VIEW_PUBLIC,
    PERMISSIONS.PROPERTY_VIEW_ALL,
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_EDIT_OWN,
    PERMISSIONS.PROPERTY_EDIT_ANY,
    PERMISSIONS.PROPERTY_DELETE_OWN,
    PERMISSIONS.PROPERTY_DELETE_ANY,
    PERMISSIONS.PROPERTY_APPROVE,
    PERMISSIONS.PROPERTY_FEATURE,
    PERMISSIONS.PROPERTY_EXPORT,

    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_VIEW_ALL,
    PERMISSIONS.BOOKING_MANAGE_OWN,
    PERMISSIONS.BOOKING_MANAGE_ALL,

    PERMISSIONS.INQUIRY_CREATE,
    PERMISSIONS.INQUIRY_VIEW_OWN,
    PERMISSIONS.INQUIRY_VIEW_ALL,
    PERMISSIONS.INQUIRY_REPLY,

    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_VIEW_OWN,
    PERMISSIONS.PAYMENT_VIEW_ALL,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.FINANCIAL_ANALYTICS,
    PERMISSIONS.DIRECT_RENTAL_CREATE,

    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_ASSIGN,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,

    PERMISSIONS.REVIEW_CREATE,
    PERMISSIONS.REVIEW_MODERATE,

    PERMISSIONS.AI_CHAT,
    PERMISSIONS.AI_PRICE_PREDICTION,
    PERMISSIONS.AI_GENERATE_DESCRIPTION,
  ],

  USER: [
    // Manager / Staff / Agent Role
    PERMISSIONS.PROPERTY_VIEW_PUBLIC,
    PERMISSIONS.PROPERTY_VIEW_ALL,
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_EDIT_OWN,
    PERMISSIONS.PROPERTY_DELETE_OWN,
    PERMISSIONS.PROPERTY_EXPORT,

    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_MANAGE_OWN,

    PERMISSIONS.INQUIRY_VIEW_OWN,
    PERMISSIONS.INQUIRY_REPLY,

    PERMISSIONS.PAYMENT_VIEW_OWN,
    PERMISSIONS.DIRECT_RENTAL_CREATE,

    PERMISSIONS.REVIEW_CREATE,

    PERMISSIONS.AI_CHAT,
    PERMISSIONS.AI_PRICE_PREDICTION,
    PERMISSIONS.AI_GENERATE_DESCRIPTION,
  ],

  CUSTOMER: [
    // Registered Tenant / Buyer Role
    PERMISSIONS.PROPERTY_VIEW_PUBLIC,

    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_VIEW_OWN,

    PERMISSIONS.INQUIRY_CREATE,
    PERMISSIONS.INQUIRY_VIEW_OWN,

    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_VIEW_OWN,

    PERMISSIONS.REVIEW_CREATE,

    PERMISSIONS.AI_CHAT,
    PERMISSIONS.AI_PRICE_PREDICTION,
  ],

  PUBLIC: [
    // Guest / Anonymous Visitor
    PERMISSIONS.PROPERTY_VIEW_PUBLIC,
    PERMISSIONS.INQUIRY_CREATE,
    PERMISSIONS.AI_CHAT,
  ],
};

// Fast lookup sets
const PERMISSION_SETS: Record<Role, Set<Permission>> = {
  ADMIN: new Set(ROLE_PERMISSIONS.ADMIN),
  USER: new Set(ROLE_PERMISSIONS.USER),
  CUSTOMER: new Set(ROLE_PERMISSIONS.CUSTOMER),
  PUBLIC: new Set(ROLE_PERMISSIONS.PUBLIC),
};

/**
 * Normalizes input role string to a canonical Role type.
 */
export function normalizeRole(role: string | null | undefined): Role {
  if (!role) return "PUBLIC";
  const upper = role.toUpperCase().trim();
  if (upper === "ADMIN") return "ADMIN";
  if (upper === "USER" || upper === "MANAGER" || upper === "AGENT") return "USER";
  if (upper === "CUSTOMER" || upper === "CLIENT") return "CUSTOMER";
  return "PUBLIC";
}

/**
 * Checks if a specific role possesses a permission.
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  const normalized = normalizeRole(role);
  return PERMISSION_SETS[normalized]?.has(permission) ?? false;
}

/**
 * Checks if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  const normalized = normalizeRole(role);
  const userPerms = PERMISSION_SETS[normalized];
  if (!userPerms) return false;
  return permissions.some((p) => userPerms.has(p));
}

/**
 * Checks if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  const normalized = normalizeRole(role);
  const userPerms = PERMISSION_SETS[normalized];
  if (!userPerms) return false;
  return permissions.every((p) => userPerms.has(p));
}

/**
 * Resource-level authorization: checks if a user has management access to a property.
 * Administrators have access to all properties; managers have access only to their own.
 */
export function canManageProperty(
  user: { id?: string | null; role?: string | null } | null | undefined,
  property: { managerId?: string | null } | null | undefined
): boolean {
  if (!user || !user.id) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === "ADMIN") return true;
  if (normalizedRole === "USER" && property?.managerId === user.id) return true;
  return false;
}

/**
 * Resource-level authorization: checks if a user has access to a booking.
 */
export function canAccessBooking(
  user: { id?: string | null; role?: string | null } | null | undefined,
  booking: { customerId?: string | null; managerId?: string | null } | null | undefined
): boolean {
  if (!user || !user.id) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === "ADMIN") return true;
  if (normalizedRole === "USER" && booking?.managerId === user.id) return true;
  if (normalizedRole === "CUSTOMER" && booking?.customerId === user.id) return true;
  return false;
}

/**
 * Resource-level authorization: checks if a user has access to an inquiry.
 */
export function canAccessInquiry(
  user: { id?: string | null; role?: string | null } | null | undefined,
  inquiry: { customerId?: string | null; managerId?: string | null } | null | undefined
): boolean {
  if (!user || !user.id) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === "ADMIN") return true;
  if (normalizedRole === "USER" && inquiry?.managerId === user.id) return true;
  if (normalizedRole === "CUSTOMER" && inquiry?.customerId === user.id) return true;
  return false;
}

/**
 * Resolves the canonical dashboard/home route path for a given role.
 */
export function getRoleDefaultPath(role: string | null | undefined): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case "ADMIN":
      return "/admin";
    case "USER":
      return "/dashboard";
    case "CUSTOMER":
      return "/customer";
    default:
      return "/";
  }
}
