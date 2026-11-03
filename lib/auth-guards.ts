/**
 * ================================================================
 * SERVER-SIDE AUTHENTICATION & AUTHORIZATION GUARDS
 * ================================================================
 * Standardized server-side helpers for API route handlers and
 * server actions. Enforces authentication, active account verification,
 * role restrictions, and granular RBAC permissions.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  Role,
  Permission,
  normalizeRole,
  hasPermission,
} from "@/lib/rbac";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: Role;
  isActive: boolean;
}

/**
 * Standardized 401 Unauthorized Response
 */
export function unauthorizedResponse(
  message = "Authentication required. Please sign in to continue."
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

/**
 * Standardized 403 Forbidden Response
 */
export function forbiddenResponse(
  message = "Forbidden. You do not have permission to access this resource."
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "FORBIDDEN",
    },
    { status: 403 }
  );
}

/**
 * Standardized 403 Account Deactivated Response
 */
export function deactivatedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Account is deactivated. Please contact support.",
      code: "ACCOUNT_DEACTIVATED",
    },
    { status: 403 }
  );
}

/**
 * Retrieves the current authenticated user session, verifying active status.
 * Returns null if not logged in or account is deactivated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const isActive = (session.user as any).isActive !== false;
    if (!isActive) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: normalizeRole(session.user.role),
      isActive: true,
    };
  } catch (error) {
    console.error("[getAuthenticatedUser] Error resolving session:", error);
    return null;
  }
}

/**
 * Requires an authenticated, active user.
 * Returns { user } or { response: NextResponse } for early return in Route Handlers.
 */
export async function requireAuth(): Promise<
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: unauthorizedResponse() };
  }

  const isActive = (session.user as any).isActive !== false;
  if (!isActive) {
    return { response: deactivatedResponse() };
  }

  const user: AuthenticatedUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: normalizeRole(session.user.role),
    isActive: true,
  };

  return { user };
}

/**
 * Requires that the authenticated user has one of the allowed roles.
 */
export async function requireRole(
  allowedRoles: Role | Role[]
): Promise<
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult;
  }

  const { user } = authResult;
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(user.role)) {
    return {
      response: forbiddenResponse(
        `Insufficient privileges. Required role: ${rolesArray.join(" or ")}.`
      ),
    };
  }

  return { user };
}

/**
 * Requires that the authenticated user possesses a specific granular RBAC permission.
 */
export async function requirePermission(
  permission: Permission
): Promise<
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult;
  }

  const { user } = authResult;
  if (!hasPermission(user.role, permission)) {
    return {
      response: forbiddenResponse(
        `Forbidden. Missing required permission: ${permission}.`
      ),
    };
  }

  return { user };
}
