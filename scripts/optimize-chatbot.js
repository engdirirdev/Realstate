const fs = require('fs');
let code = fs.readFileSync('components/AIChatbot.tsx', 'utf8');

// Update imports
code = code.replace(
  'import { useState, useRef, useEffect } from "react";',
  'import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";'
);

// Extract ChatPropertyCard before AIChatbot
const cardComponent = `
// ─── MEMOIZED CHAT PROPERTY CARD SUB-COMPONENT ────────────────────
const ChatPropertyCard = memo(function ChatPropertyCard({
  property: p,
  onFavoriteToggle,
  onShareProperty,
}: {
  property: GroundedPropertyResult;
  onFavoriteToggle: (id: string) => void;
  onShareProperty: (id: string, title: string) => void;
}) {
  return (
    <div className="bg-white border border-[#E8E1D4] rounded-2xl p-3.5 shadow-xs space-y-3 hover:border-[#C89B3C] transition-colors">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#E8E1D4] relative">
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.title}
              fill
              sizes="80px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
              No image
            </div>
          )}
          <span className="absolute top-1 left-1 bg-[#07111F]/80 text-[#D9B45B] text-[9px] font-bold px-1.5 py-0.5 rounded">
            {p.typeLabel}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full border \${p.statusColor}\`}>
              {p.statusEmoji}
            </span>
            <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FBF7EE] px-1.5 py-0.5 rounded border border-[#E8DCC2]">
              ★ {typeof p.aiMatchScore === "number" && !isNaN(p.aiMatchScore) && p.aiMatchScore > 0 ? p.aiMatchScore : 95}% Match
            </span>
          </div>

          <h4 className="font-bold text-[#07111F] text-xs mt-1 truncate">
            {p.title}
          </h4>
          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />{" "}
            {p.district ? \`\${p.district}, \` : ""}
            {p.city}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-black text-[#07111F]">
              {p.formattedPrice}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {p.listingType}
            </span>
          </div>
        </div>
      </div>

      {/* Property Specifications */}
      {String(p.type || "").toUpperCase() === "LAND" ||
      String(p.typeLabel || "").toUpperCase() === "LAND" ||
      p.bedrooms === 0 ? (
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[11px] font-semibold text-[#07111F] border border-[#E8E1D4]">
          <SquareStack className="h-3.5 w-3.5 text-[#C89B3C]" />
          <span className="inline-flex items-center gap-1">
            <span>
              {String(p.type || "").toUpperCase() === "LAND" || String(p.typeLabel || "").toUpperCase() === "LAND"
                ? "Land Plot Area:"
                : "Total Usable Area:"}
            </span>
            <strong className="font-bold">{\`\${p.areaSize || (p as any).area || (p as any).landSize || 400} m²\`}</strong>
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[10px] text-slate-700 border border-[#E8E1D4]">
          <span className="flex items-center gap-1 truncate">
            <BedDouble className="h-3 w-3 text-[#C89B3C]" />
            <span>{\`\${p.bedrooms} Beds\`}</span>
          </span>
          <span className="flex items-center gap-1 truncate">
            <Bath className="h-3 w-3 text-[#C89B3C]" />
            <span>{\`\${p.bathrooms} Baths\`}</span>
          </span>
          <span className="truncate">{\`\${p.areaSize || (p as any).area} m²\`}</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <Link
          href={\`/properties/\${p.id}\`}
          className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#C89B3C] hover:bg-[#B88924] text-[#07111F] rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Details
        </Link>
        <button
          type="button"
          onClick={() => onFavoriteToggle(p.id)}
          className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
        >
          <Heart className="h-3 w-3 text-rose-500" /> Save
        </button>
        <button
          type="button"
          onClick={() => onShareProperty(p.id, p.title)}
          className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
        >
          <Share2 className="h-3 w-3 text-[#C89B3C]" /> Share
        </button>
      </div>
    </div>
  );
});
`;

code = code.replace('export default function AIChatbot() {', cardComponent + '\nexport default function AIChatbot() {');

// Replace state and redundant useEffect
const oldStateAndEffect = `  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role || "PUBLIC";
  const userName = session?.user?.name || "Guest";

  // Listen for global open event
  useEffect(() => {
    const handleOpen = (e?: any) => {
      setIsOpen(true);
      if (e?.detail?.message) {
        setInput(e.detail.message);
      }
    };
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  // Role-aware suggestions
  const getSuggestions = () => {
    if (role === "ADMIN") {
      return [
        "How many pending properties need review?",
        "Show platform revenue summary",
        "How many registered users are active?",
      ];
    }
    if (role === "USER") {
      return [
        "How many properties do I have listed?",
        "Show my pending or rejected listings",
        "How can I improve my property descriptions?",
      ];
    }
    if (role === "CUSTOMER") {
      return [
        "Recommend properties matching my budget",
        "Show 3-bedroom houses in Mogadishu",
        "Explain how ML price prediction works",
      ];
    }
    return [
      "Find apartments under $50,000",
      "What real estate services do you provide?",
      "Show me properties in Mogadishu",
    ];
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText =
        role === "ADMIN"
          ? \`Hello Admin \${userName}! I can help you monitor pending approvals, platform stats, and revenue.\`
          : role === "USER"
          ? \`Hello Agent \${userName}! Ask me about your property listings, approval statuses, or inquiries.\`
          : role === "CUSTOMER"
          ? \`Welcome \${userName}! I can recommend properties based on your preferences or answer housing questions.\`
          : \`Welcome to Kiro-Maal Real Estate! Ask me anything about properties, locations, or price predictions in Somalia.\`;

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [role, userName, messages.length]);`;

const newStateAndEffect = `  const [sessionId, setSessionId] = useState<string | null>(null);
  const role = session?.user?.role || "PUBLIC";
  const userName = session?.user?.name || "Guest";

  // Lazy zero-cost initial message without double-mount render
  const [messages, setMessages] = useState<Message[]>(() => {
    const welcomeText =
      role === "ADMIN"
        ? \`Hello Admin \${userName}! I can help you monitor pending approvals, platform stats, and revenue.\`
        : role === "USER"
        ? \`Hello Agent \${userName}! Ask me about your property listings, approval statuses, or inquiries.\`
        : role === "CUSTOMER"
        ? \`Welcome \${userName}! I can recommend properties based on your preferences or answer housing questions.\`
        : \`Welcome to Kiro-Maal Real Estate! Ask me anything about properties, locations, or price predictions in Somalia.\`;
    return [
      {
        id: "welcome",
        role: "assistant",
        content: welcomeText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = (e?: any) => {
      setIsOpen(true);
      if (e?.detail?.message) {
        setInput(e.detail.message);
      }
    };
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  // Memoized role-aware suggestions
  const suggestions = useMemo(() => {
    if (role === "ADMIN") {
      return [
        "How many pending properties need review?",
        "Show platform revenue summary",
        "How many registered users are active?",
      ];
    }
    if (role === "USER") {
      return [
        "How many properties do I have listed?",
        "Show my pending or rejected listings",
        "How can I improve my property descriptions?",
      ];
    }
    if (role === "CUSTOMER") {
      return [
        "Recommend properties matching my budget",
        "Show 3-bedroom houses in Mogadishu",
        "Explain how ML price prediction works",
      ];
    }
    return [
      "Find apartments under $50,000",
      "What real estate services do you provide?",
      "Show me properties in Mogadishu",
    ];
  }, [role]);`;

code = code.replace(oldStateAndEffect.replace(/\n/g, '\r\n'), newStateAndEffect.replace(/\n/g, '\r\n'));
if (!code.includes('suggestions = useMemo(')) {
  code = code.replace(oldStateAndEffect, newStateAndEffect);
}

// Replace getSuggestions() call with suggestions
code = code.replace(/getSuggestions\(\)/g, 'suggestions');

// Replace inner property card mapping with ChatPropertyCard
const oldCardMapping = `{msg.properties.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-[#E8E1D4] rounded-2xl p-3.5 shadow-xs space-y-3 hover:border-[#C89B3C] transition-colors"
                          >
                            <div className="flex gap-3">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#E8E1D4] relative">
                                {p.imageUrl ? (
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.title}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                    No image
                                  </div>
                                )}
                                <span className="absolute top-1 left-1 bg-[#07111F]/80 text-[#D9B45B] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {p.typeLabel}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span
                                    className={\`text-[10px] font-bold px-2 py-0.5 rounded-full border \${p.statusColor}\`}
                                  >
                                    {p.statusEmoji}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FBF7EE] px-1.5 py-0.5 rounded border border-[#E8DCC2]">
                                    ★ {typeof p.aiMatchScore === "number" && !isNaN(p.aiMatchScore) && p.aiMatchScore > 0 ? p.aiMatchScore : 95}% Match
                                  </span>
                                </div>

                                <h4 className="font-bold text-[#07111F] text-xs mt-1 truncate">
                                  {p.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />{" "}
                                  {p.district ? \`\${p.district}, \` : ""}
                                  {p.city}
                                </p>
                                <div className="flex items-baseline justify-between mt-1">
                                  <span className="text-sm font-black text-[#07111F]">
                                    {p.formattedPrice}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {p.listingType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Property Specifications */}
                            {String(p.type || "").toUpperCase() === "LAND" ||
                            String(p.typeLabel || "").toUpperCase() === "LAND" ||
                            p.bedrooms === 0 ? (
                              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[11px] font-semibold text-[#07111F] border border-[#E8E1D4]">
                                <SquareStack className="h-3.5 w-3.5 text-[#C89B3C]" />
                                <span className="inline-flex items-center gap-1">
                                  <span>
                                    {String(p.type || "").toUpperCase() === "LAND" || String(p.typeLabel || "").toUpperCase() === "LAND"
                                      ? "Land Plot Area:"
                                      : "Total Usable Area:"}
                                  </span>
                                  <strong className="font-bold">{\`\${p.areaSize || (p as any).area || (p as any).landSize || 400} m²\`}</strong>
                                </span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-[#F7F3EA] rounded-xl text-[10px] text-slate-700 border border-[#E8E1D4]">
                                <span className="flex items-center gap-1 truncate">
                                  <BedDouble className="h-3 w-3 text-[#C89B3C]" />
                                  <span>{\`\${p.bedrooms} Beds\`}</span>
                                </span>
                                <span className="flex items-center gap-1 truncate">
                                  <Bath className="h-3 w-3 text-[#C89B3C]" />
                                  <span>{\`\${p.bathrooms} Baths\`}</span>
                                </span>
                                <span className="truncate">{\`\${p.areaSize || (p as any).area} m²\`}</span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <Link
                                href={\`/properties/\${p.id}\`}
                                className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 bg-[#C89B3C] hover:bg-[#B88924] text-[#07111F] rounded-xl text-xs font-bold shadow-xs transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleFavoriteToggle(p.id)}
                                className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
                              >
                                <Heart className="h-3 w-3 text-rose-500" /> Save
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareProperty(p.id, p.title)}
                                className="inline-flex items-center justify-center gap-1 py-1 bg-white border border-[#E8E1D4] hover:bg-[#F7F3EA] text-slate-700 rounded-xl text-[11px] font-medium"
                              >
                                <Share2 className="h-3 w-3 text-[#C89B3C]" /> Share
                              </button>
                            </div>
                          </div>
                        ))}`;

const newCardMapping = `{msg.properties.map((p) => (
                          <ChatPropertyCard
                            key={p.id}
                            property={p}
                            onFavoriteToggle={handleFavoriteToggle}
                            onShareProperty={handleShareProperty}
                          />
                        ))}`;

code = code.replace(oldCardMapping.replace(/\n/g, '\r\n'), newCardMapping.replace(/\n/g, '\r\n'));
if (!code.includes('<ChatPropertyCard')) {
  code = code.replace(oldCardMapping, newCardMapping);
}

fs.writeFileSync('components/AIChatbot.tsx', code, 'utf8');
console.log('AIChatbot optimized successfully');

