"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
  Role,
  Permission,
  normalizeRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/lib/rbac";

export interface UsePermissionsResult {
  role: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCustomer: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

/**
 * React hook to check permissions in client components.
 */
export function usePermissions(): UsePermissionsResult {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const role = normalizeRole(session?.user?.role);

  return {
    role,
    isLoading,
    isAuthenticated,
    isAdmin: role === "ADMIN",
    isManager: role === "USER",
    isCustomer: role === "CUSTOMER",
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(role, permissions),
  };
}

interface AuthorizeProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component for guarding UI elements by permission.
 */
export function Authorize({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: AuthorizeProps) {
  const { role, isLoading } = usePermissions();

  if (isLoading) return null;

  if (permission && !hasPermission(role, permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const authorized = requireAll
      ? hasAllPermissions(role, permissions)
      : hasAnyPermission(role, permissions);

    if (!authorized) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

interface RoleGateProps {
  allowedRoles: Role | Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component for guarding UI elements by role.
 */
export function RoleGate({
  allowedRoles,
  fallback = null,
  children,
}: RoleGateProps) {
  const { role, isLoading } = usePermissions();

  if (isLoading) return null;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
