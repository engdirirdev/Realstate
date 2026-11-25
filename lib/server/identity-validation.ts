// ================================================================
// Server-Only Identity Validation:
// 1. Real Email Verification (Syntax + Disposable Check + Live DNS MX Lookup)
// 2. Somali Phone Validation (+252 + 9 digits starting with 61-66, 90, 77)
// 3. Global Cross-Portal Uniqueness for Email & Phone across ALL roles
// ================================================================
import dns from "dns/promises";
import { prisma } from "@/lib/prisma";
import {
  extractSomaliLocalDigits,
  validateEmailFormat,
  validateSomaliPhone,
} from "@/lib/validation";

const DNS_TIMEOUT_MS = 4500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Verifies that an email address is syntactically valid, not disposable/fake,
 * AND that its domain actually exists with active MX mail servers via live DNS.
 */
export async function verifyRealEmailServer(rawEmail: string | null | undefined): Promise<{
  valid: boolean;
  normalized: string;
  error?: string;
}> {
  const fmt = validateEmailFormat(rawEmail);
  if (!fmt.valid) {
    return fmt;
  }

  const domain = fmt.normalized.split("@")[1];

  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS);
    const activeMx = (mxRecords || []).filter(
      (r) => r.exchange && r.exchange.trim() !== "" && r.exchange.trim() !== "."
    );

    if (activeMx.length === 0) {
      return {
        valid: false,
        normalized: fmt.normalized,
        error: `The email domain "${domain}" cannot receive emails (no mail servers found). Please use a real, existing email address.`,
      };
    }

    return { valid: true, normalized: fmt.normalized };
  } catch (err: any) {
    const code = err?.code || err?.message || "";
    if (
      code === "ENOTFOUND" ||
      code === "ENODATA" ||
      code === "ESERVFAIL" ||
      code === "EREFUSED" ||
      code === "EBADNAME"
    ) {
      return {
        valid: false,
        normalized: fmt.normalized,
        error: `The email domain "${domain}" does not exist or has no active mail server. Please enter a real, existing email address.`,
      };
    }

    // If DNS timed out due to temporary network hiccup, do a secondary A-record check before rejecting
    try {
      const aRecords = await withTimeout(dns.resolve4(domain), 2500);
      if (!aRecords || aRecords.length === 0) {
        return {
          valid: false,
          normalized: fmt.normalized,
          error: `Could not verify email domain "${domain}". Please use a real, existing email address.`,
        };
      }
      return { valid: true, normalized: fmt.normalized };
    } catch {
      return {
        valid: false,
        normalized: fmt.normalized,
        error: `The email address "${fmt.normalized}" could not be verified as an existing email domain. Please enter a real email address.`,
      };
    }
  }
}

/**
 * Enforces global uniqueness of email AND phone across the entire system
 * (ADMIN, USER/Manager, and CUSTOMER portals).
 */
export async function assertUniqueUserIdentity(params: {
  email?: string | null;
  phone?: string | null;
  excludeUserId?: string;
}): Promise<{ ok: true } | { ok: false; field: "email" | "phone"; error: string }> {
  const { email, phone, excludeUserId } = params;

  // 1. Global Email Uniqueness
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const existingByEmail = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: { id: true, role: true },
    });

    if (existingByEmail) {
      return {
        ok: false,
        field: "email",
        error:
          "This email address is already registered in the system. The same email cannot be used again in any portal.",
      };
    }
  }

  // 2. Global Phone Uniqueness (canonical digit-level comparison so formatted & unformatted match)
  if (phone) {
    const targetLocal = extractSomaliLocalDigits(phone);
    if (targetLocal) {
      const usersWithPhone = await prisma.user.findMany({
        where: {
          phone: { not: null },
          ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
        },
        select: { id: true, phone: true, role: true },
      });

      const phoneConflict = usersWithPhone.find(
        (u) => u.phone && extractSomaliLocalDigits(u.phone) === targetLocal
      );

      if (phoneConflict) {
        return {
          ok: false,
          field: "phone",
          error:
            "This phone number (+252" +
            targetLocal +
            ") is already registered in the system. The same phone number cannot be used again in any portal.",
        };
      }
    }
  }

  return { ok: true };
}

export { validateSomaliPhone };

