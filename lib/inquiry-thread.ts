export interface InquiryThreadMessage {
  id: string;
  sender: "CUSTOMER" | "MANAGER" | "ADMIN";
  senderName: string;
  text: string;
  timestamp: string;
}

const THREAD_PREFIX = "__THREAD_JSON__:";

/**
 * Parses an Inquiry record (with `message` and `response` fields) into a
 * strictly chronological list of conversation messages (Customer <-> Manager).
 * Automatically migrates legacy appended strings (e.g. `[name • time]: ...`)
 * into chronological turns so Customer 1 -> Manager 1 -> Customer 2 -> Manager 2.
 */
export function parseInquiryThread(inq: {
  id?: string;
  message?: string | null;
  response?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  customer?: { name?: string | null } | null;
  manager?: { name?: string | null } | null;
  name?: string | null;
}): InquiryThreadMessage[] {
  const customerName = inq.customer?.name || inq.name || "Customer";
  const managerName = inq.manager?.name || "Property Manager";
  const baseDate = inq.createdAt
    ? new Date(inq.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  // 1. Check if `response` stores the structured JSON thread
  if (inq.response && inq.response.startsWith(THREAD_PREFIX)) {
    try {
      const jsonStr = inq.response.slice(THREAD_PREFIX.length);
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall through to legacy parser
    }
  }

  // 2. Legacy parser: reconstruct chronological turns from `message` and `response`
  const rawMsg = (inq.message || "").trim();
  const rawResp = (inq.response || "").trim();

  // Split any follow-up blocks like `\n\n[said • Nov 20, 08:21 AM]:\ngoormaa...`
  const followUpRegex = /\n\n\[([^\]]+?)\s*•\s*([^\]]+?)\]:\n?([\s\S]*?)(?=\n\n\[[^\]]+?\s*•\s*[^\]]+?\]:|$)/g;
  const firstMatchIdx = rawMsg.search(/\n\n\[[^\]]+?\s*•\s*[^\]]+?\]:/);
  const initialCustomerText =
    firstMatchIdx !== -1 ? rawMsg.slice(0, firstMatchIdx).trim() : rawMsg;

  const followUps: { senderName: string; timestamp: string; text: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = followUpRegex.exec(rawMsg)) !== null) {
    if (match[3] && match[3].trim()) {
      followUps.push({
        senderName: match[1].trim() || customerName,
        timestamp: match[2].trim(),
        text: match[3].trim(),
      });
    }
  }

  const turns: InquiryThreadMessage[] = [];

  if (initialCustomerText) {
    turns.push({
      id: `${inq.id || "inq"}-c-0`,
      sender: "CUSTOMER",
      senderName: customerName,
      text: initialCustomerText,
      timestamp: baseDate,
    });
  }

  // In the legacy format, the manager replied to the initial message, and then the customer sent follow-ups
  if (rawResp) {
    turns.push({
      id: `${inq.id || "inq"}-m-0`,
      sender: "MANAGER",
      senderName: managerName,
      text: rawResp,
      timestamp: inq.updatedAt
        ? new Date(inq.updatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : baseDate,
    });
  }

  followUps.forEach((fu, idx) => {
    turns.push({
      id: `${inq.id || "inq"}-c-${idx + 1}`,
      sender: "CUSTOMER",
      senderName: fu.senderName,
      text: fu.text,
      timestamp: fu.timestamp,
    });
  });

  return turns;
}

/**
 * Serializes a thread array into the `response` column format while keeping
 * `message` clean as the initial customer message.
 */
export function serializeInquiryThread(turns: InquiryThreadMessage[]): string {
  return `${THREAD_PREFIX}${JSON.stringify(turns)}`;
}

