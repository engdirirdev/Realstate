// ================================================================
// Server-Only Identity Validation:
// 1. Real Email Verification (Syntax + Disposable Check + Live DNS MX Lookup)
// 2. Somali Phone Validation (+252 + 9 digits starting with 61-66, 90, 77)
// 3. Global Cross-Portal Uniqueness for Email & Phone across ALL roles
// ================================================================
import dns from "dns/promises";
import net from "net";
import { prisma } from "@/lib/prisma";
import {
  extractSomaliLocalDigits,
  validateEmailFormat,
  validateSomaliPhone,
  validateStrongPassword,
} from "@/lib/validation";

const DNS_TIMEOUT_MS = 4500;
const SMTP_TIMEOUT_MS = 5500;

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

type SmtpProbeResult =
  | { verdict: "EXISTS" }
  | { verdict: "NOT_FOUND"; reply: string }
  | { verdict: "INCONCLUSIVE"; reason: string };

/**
 * Connects directly to the domain's MX mail server over SMTP (port 25) and
 * issues RCPT TO:<email> without sending any email, verifying whether the
 * actual mailbox exists (e.g. catches fake @gmail.com addresses via 550 5.1.1).
 */
function probeSmtpMailbox(email: string, mxHost: string): Promise<SmtpProbeResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SmtpProbeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(result);
    };

    const socket = net.createConnection({ port: 25, host: mxHost });
    const timer = setTimeout(() => {
      finish({ verdict: "INCONCLUSIVE", reason: "SMTP_TIMEOUT" });
    }, SMTP_TIMEOUT_MS);

    let step = 0;
    let buffer = "";

    socket.on("error", (err: any) => {
      finish({ verdict: "INCONCLUSIVE", reason: err?.code || "SMTP_ERROR" });
    });

    socket.on("close", () => {
      finish({ verdict: "INCONCLUSIVE", reason: "SMTP_CLOSED" });
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (!buffer.includes("\n")) return;

      const lines = buffer.split(/\r?\n/).filter((l) => l.length > 0);
      const lastLine = lines[lines.length - 1] || "";

      // Wait until final line of multi-line SMTP response (code followed by space, not hyphen)
      if (!/^\d{3} /.test(lastLine)) return;

      const code = parseInt(lastLine.slice(0, 3), 10);
      const fullReply = lines.join(" ").trim();
      buffer = "";

      if (step === 0) {
        if (code === 220) {
          step = 1;
          socket.write("EHLO kiromaal.so\r\n");
        } else {
          finish({ verdict: "INCONCLUSIVE", reason: `BANNER_${code}` });
        }
      } else if (step === 1) {
        if (code === 250) {
          step = 2;
          socket.write("MAIL FROM:<noreply@kiromaal.so>\r\n");
        } else {
          finish({ verdict: "INCONCLUSIVE", reason: `EHLO_${code}` });
        }
      } else if (step === 2) {
        if (code === 250) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish({ verdict: "INCONCLUSIVE", reason: `MAILFROM_${code}` });
        }
      } else if (step === 3) {
        try {
          socket.write("QUIT\r\n");
        } catch {
          // ignore
        }

        if (code === 250 || code === 251) {
          finish({ verdict: "EXISTS" });
        } else if (code >= 500 && code < 600) {
          finish({ verdict: "NOT_FOUND", reply: fullReply });
        } else {
          finish({ verdict: "INCONCLUSIVE", reason: `RCPT_${code}` });
        }
      }
    });
  });
}

/**
 * Verifies that an email address is syntactically valid, not disposable/fake,
 * has active DNS MX mail servers, AND passes live SMTP mailbox verification
 * so fake addresses (like random12345@gmail.com) are rejected.
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
    const activeMx = (mxRecords || [])
      .filter((r) => r.exchange && r.exchange.trim() !== "" && r.exchange.trim() !== ".")
      .sort((a, b) => a.priority - b.priority);

    if (activeMx.length === 0) {
      return {
        valid: false,
        normalized: fmt.normalized,
        error: `The email domain "${domain}" cannot receive emails (no mail servers found). Please use a real, existing email address.`,
      };
    }

    // Live SMTP RCPT TO mailbox check against primary MX host (fallback to 2nd MX if inconclusive)
    for (const mx of activeMx.slice(0, 2)) {
      const probe = await probeSmtpMailbox(fmt.normalized, mx.exchange);
      if (probe.verdict === "EXISTS") {
        return { valid: true, normalized: fmt.normalized };
      }
      if (probe.verdict === "NOT_FOUND") {
        return {
          valid: false,
          normalized: fmt.normalized,
          error: `The email address "${fmt.normalized}" does not exist. Please enter a real, existing email address.`,
        };
      }
    }

    // If MX exists and SMTP probe was blocked/greylisted by provider, allow verified MX domain
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

    return {
      valid: false,
      normalized: fmt.normalized,
      error: `The email address "${fmt.normalized}" could not be verified as an existing email. Please enter a real email address.`,
    };
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

export { validateSomaliPhone, validateStrongPassword };

