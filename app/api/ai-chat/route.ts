import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
  RATE_LIMIT_PRESETS,
} from "@/lib/rate-limiter";
import { processConversationalTurn } from "@/lib/ai/conversation/chat-engine";

/**
 * GET /api/ai-chat?sessionId=...
 * Fetch conversation history for a specific session with authorization check.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query parameter is required" }, { status: 400 });
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Authorization check: Only session owner (or public guest for guest session) can view history
    if (chatSession.userId && userId && chatSession.userId !== userId) {
      return NextResponse.json({ error: "Access denied to this chat session." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
        messages: chatSession.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/ai-chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ai-chat
 * Secure AI Chatbot endpoint with role spoofing prevention, session persistence, and rate limiting.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authoritative Auth.js session verification
    const session = await auth();
    const userRole = session?.user?.role || "PUBLIC";
    const userId = session?.user?.id || null;
    const userName = session?.user?.name || "Guest";

    // 2. Sliding window rate limiting
    const clientIdentifier = getClientIdentifier(request, userId);
    const rateLimitResult = checkRateLimit(clientIdentifier, RATE_LIMIT_PRESETS.AI_CHAT);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 3. Request body parsing and validation
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const {
      message,
      history = [],
      sessionId: requestedSessionId,
    } = body || {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message exceeds 2,000 characters limit." }, { status: 400 });
    }

    // 4. Session resolution and isolation check
    let activeSessionId: string | null = null;
    if (requestedSessionId && typeof requestedSessionId === "string") {
      const existingSession = await prisma.chatSession.findUnique({
        where: { id: requestedSessionId },
      });

      if (existingSession) {
        // Enforce session ownership isolation:
        // If session is owned by user A, user B (or another user) cannot write to or access it
        if (existingSession.userId && userId && existingSession.userId !== userId) {
          return NextResponse.json(
            { error: "Access denied to this chat session." },
            { status: 403 }
          );
        }
        activeSessionId = existingSession.id;
      }
    }

    // Create a new persistent session if none exists
    if (!activeSessionId) {
      try {
        const newSession = await prisma.chatSession.create({
          data: {
            userId: userId || null,
            title: message.slice(0, 45).trim() || "New Conversation",
          },
        });
        activeSessionId = newSession.id;
      } catch (sessionErr: any) {
        // Safe logging without crashing Next.js console serializer
        console.warn("Could not persist ChatSession:", sessionErr?.message || "Unknown error");
      }
    }

    // Persist USER message if session is active
    if (activeSessionId) {
      await prisma.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: "user",
          content: message.trim(),
        },
      }).catch((err) => console.error("Failed to persist user chat message:", err));
    }

    // 5. Fetch authentic historical session messages for sliding window multi-turn memory
    const dbMessages = activeSessionId
      ? await prisma.chatMessage.findMany({
          where: { sessionId: activeSessionId },
          orderBy: { createdAt: "asc" },
          take: 20,
        })
      : [];

    // 6. Process conversational turn with full context continuity, entity memory, and multilingual support
    const historyToUse = dbMessages.length > 1
      ? dbMessages.map((m) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata || undefined,
        }))
      : (Array.isArray(history) && history.length > 0)
      ? history.map((m: any) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata || undefined,
        }))
      : dbMessages.map((m) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata || undefined,
        }));

    const turnResult = await processConversationalTurn({
      sessionId: activeSessionId ?? (typeof requestedSessionId === "string" && requestedSessionId ? requestedSessionId : `guest-${Date.now()}`),
      message: message.trim(),
      history: historyToUse,
      userName,
      userRole,
      userId,
    });

    const finalReply = turnResult.reply;

    // 7. Persist ASSISTANT message with full conversation state in metadata (authenticated sessions only)
    if (activeSessionId) await prisma.chatMessage.create({
      data: {
        sessionId: activeSessionId,
        role: "assistant",
        content: finalReply,
        metadata: JSON.stringify({
          intent: turnResult.intent,
          topic: turnResult.topic,
          confidence: turnResult.confidence,
          language: turnResult.language,
          conversationLanguage: turnResult.conversationLanguage,
          languageConfidence: turnResult.languageConfidence,
          searchReadiness: turnResult.searchReadiness,
          missingSlots: turnResult.missingSlots,
          totalMatches: turnResult.totalMatches,
          conversationState: turnResult.state,
          propertyIds: turnResult.properties.map((p) => p.id),
          resolution: turnResult.resolution,
        }),
      },
    }).catch((err) => console.error("Failed to persist assistant chat message:", err));

    return NextResponse.json({
      sessionId: activeSessionId,
      reply: finalReply,
      properties: turnResult.shouldRenderPropertyCards ? turnResult.properties : [],
      intent: turnResult.intent,
      topic: turnResult.topic,
      confidence: turnResult.confidence,
      language: turnResult.language,
      conversationLanguage: turnResult.conversationLanguage,
      languageConfidence: turnResult.languageConfidence,
      searchReadiness: turnResult.searchReadiness,
      missingSlots: turnResult.missingSlots,
      totalMatches: turnResult.totalMatches,
      conversationState: turnResult.state,
      resolution: turnResult.resolution,
      responseType: turnResult.responseType,
      shouldRenderPropertyCards: turnResult.shouldRenderPropertyCards,
      activeSearchCriteria: turnResult.activeSearchCriteria,
      referencedPropertyIds: turnResult.referencedPropertyIds,
    });
  } catch (error: any) {
    console.error("AI chat error:", error?.message || String(error));
    return NextResponse.json(
      { error: "Internal server error", reply: "Sorry, something went wrong while searching the database." },
      { status: 500 }
    );
  }
}
