import "next-auth";
import "next-auth/jwt";
import type { Role } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role | string;
      phone?: string | null;
      isActive?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role | string;
    phone?: string | null;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | string;
    isActive?: boolean;
    lastValidated?: number;
  }
}
