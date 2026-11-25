// ================================================================
// Shared Client + Server Validation Utilities
// 1. Somali Phone Numbers: locked +252 prefix + 9 digits
//    Allowed 2-digit prefixes: 61, 62, 63, 64, 65, 66, 90, 77 (+ 7 digits)
// 2. Email Format, Typo & Disposable Domain Validation
// ================================================================

export const SOMALI_COUNTRY_CODE = "+252";

export const ALLOWED_SOMALI_PREFIXES = [
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "90",
  "77",
] as const;

export const SOMALI_LOCAL_PHONE_REGEX = /^(61|62|63|64|65|66|90|77)\d{7}$/;

const VALID_FIRST_DIGITS = new Set(["6", "7", "9"]);

/**
 * Extracts up to 9 local Somali digits from any user input (strips +252 / 252 and non-digits).
 */
export function extractSomaliLocalDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("252") && (trimmed.startsWith("+") || digits.length > 9)) {
    digits = digits.slice(3);
  }
  return digits.slice(0, 9);
}

/**
 * Checks whether a partial prefix (1 or 2 digits typed so far) can still become a valid Somali number.
 */
export function isPartialSomaliPrefixValid(localDigits: string): boolean {
  if (!localDigits) return true;
  if (localDigits.length === 1) {
    return VALID_FIRST_DIGITS.has(localDigits[0]);
  }
  const prefix = localDigits.slice(0, 2);
  return (ALLOWED_SOMALI_PREFIXES as readonly string[]).includes(prefix);
}

/**
 * Formats canonical +252XXXXXXXXX or returns "" if empty.
 */
export function normalizeSomaliPhone(raw: string | null | undefined): string | null {
  const digits = extractSomaliLocalDigits(raw);
  if (!digits) return null;
  return `${SOMALI_COUNTRY_CODE}${digits}`;
}

/**
 * Strictly validates a Somali phone number.
 * Rules:
 * - Must use +252 country code (no other country codes accepted)
 * - Must have exactly 9 digits after +252
 * - First 2 digits must be one of: 61, 62, 63, 64, 65, 66, 90, 77
 */
export function validateSomaliPhone(
  raw: string | null | undefined,
  options: { required?: boolean } = {}
): { valid: boolean; normalized: string | null; localDigits: string; error?: string } {
  const value = (raw ?? "").trim();

  // Treat empty or bare "+252" as empty
  if (!value || value === SOMALI_COUNTRY_CODE || value === "252") {
    if (options.required) {
      return {
        valid: false,
        normalized: null,
        localDigits: "",
        error:
          "Phone number is required. Enter 9 digits after +252 starting with 61, 62, 63, 64, 65, 66, 90, or 77.",
      };
    }
    return { valid: true, normalized: null, localDigits: "" };
  }

  // Reject any foreign country code (e.g. +1, +44, +254)
  if (value.startsWith("+") && !value.startsWith(SOMALI_COUNTRY_CODE)) {
    return {
      valid: false,
      normalized: null,
      localDigits: "",
      error: "Only Somali phone numbers starting with +252 are allowed.",
    };
  }

  // Strip +252 prefix if present, then check remaining characters
  const withoutCode = value.startsWith(SOMALI_COUNTRY_CODE)
    ? value.slice(SOMALI_COUNTRY_CODE.length)
    : value;

  // Allow spaces or dashes in pasted input, reject letters or symbols
  if (/[^\d\s-]/.test(withoutCode)) {
    return {
      valid: false,
      normalized: null,
      localDigits: "",
      error: "Phone number after +252 must contain digits only.",
    };
  }

  const localDigits = withoutCode.replace(/\D/g, "");

  if (!isPartialSomaliPrefixValid(localDigits)) {
    return {
      valid: false,
      normalized: null,
      localDigits,
      error:
        "Invalid Somali number prefix. After +252, the number must start with 61, 62, 63, 64, 65, 66, 90, or 77.",
    };
  }

  if (localDigits.length !== 9) {
    return {
      valid: false,
      normalized: null,
      localDigits,
      error: `Phone number must be exactly 9 digits after +252 (currently ${localDigits.length} digits).`,
    };
  }

  if (!SOMALI_LOCAL_PHONE_REGEX.test(localDigits)) {
    return {
      valid: false,
      normalized: null,
      localDigits,
      error:
        "Invalid Somali phone number. Must be +252 followed by 61, 62, 63, 64, 65, 66, 90, or 77 and 7 digits.",
    };
  }

  return {
    valid: true,
    normalized: `${SOMALI_COUNTRY_CODE}${localDigits}`,
    localDigits,
  };
}

// ─── Email Format, Typo & Disposable Domain Validation ─────────────

const STRICT_EMAIL_REGEX =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i;

const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "fake.com",
  "fake.org",
  "invalid.com",
  "localhost",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.org",
  "guerrillamail.net",
  "yopmail.com",
  "yopmail.fr",
  "10minutemail.com",
  "10minutemail.net",
  "trashmail.com",
  "sharklasers.com",
  "throwaway.email",
  "dispostable.com",
  "getnada.com",
  "maildrop.cc",
  "mohmal.com",
  "emailondeck.com",
  "mintemail.com",
  "fakeinbox.com",
  "mailnesia.com",
  "tempinbox.com",
  "burnermail.io",
  "minutemail.com",
  "nada.email",
  "asdf.com",
  "abc.com",
  "xyz.com",
]);

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "iclud.com": "icloud.com",
  "icoud.com": "icloud.com",
};

export function validateEmailFormat(raw: string | null | undefined): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (!normalized) {
    return { valid: false, normalized: "", error: "Email address is required." };
  }

  if (normalized.length > 254 || normalized.includes("..")) {
    return {
      valid: false,
      normalized,
      error: "Please enter a valid, real email address.",
    };
  }

  if (!STRICT_EMAIL_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Please enter a valid email address (e.g. name@gmail.com).",
    };
  }

  const [localPart, domain] = normalized.split("@");

  if (COMMON_DOMAIN_TYPOS[domain]) {
    return {
      valid: false,
      normalized,
      error: `Email domain "${domain}" looks misspelled. Did you mean "${COMMON_DOMAIN_TYPOS[domain]}"?`,
    };
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      normalized,
      error: `Temporary or fake email domain "${domain}" is not allowed. Please use a real email address.`,
    };
  }

  // Gmail-specific format rule: local part (before +tag) must be 6-30 chars, only letters, numbers, and dots
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const baseLocal = localPart.split("+")[0];
    if (baseLocal.length < 6 || baseLocal.length > 30 || !/^[a-z0-9.]+$/.test(baseLocal)) {
      return {
        valid: false,
        normalized,
        error: "Invalid Gmail address. Gmail usernames must be 6–30 characters using letters, numbers, or periods.",
      };
    }
  }

  return { valid: true, normalized };
}

// ─── Strong Password Validation ────────────────────────────────────

/**
 * Validates that a password is user-friendly yet secure (e.g. "Muuse11A"):
 * - At least 8 characters long
 * - At least 4 distinct characters (rejects trivial repeats like "11111111" or "Aa1Aa1Aa")
 * - At least 1 uppercase letter (A-Z), 1 lowercase letter (a-z), and 1 number (0-9)
 *   (Special characters are allowed and encouraged, but not required)
 */
export function validateStrongPassword(raw: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  const password = raw ?? "";

  if (password.length < 8) {
    return {
      valid: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  const uniqueChars = new Set(password.split("")).size;
  if (uniqueChars < 4) {
    return {
      valid: false,
      error: "Password is too repetitive. Please use a mix of different letters and numbers.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Password must include at least one uppercase letter (A–Z).",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Password must include at least one lowercase letter (a–z).",
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: "Password must include at least one number (0–9).",
    };
  }

  return { valid: true };
}

