import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  classifyUserIntent,
  searchDatabaseProperties,
  getPropertyDetailsByIdOrTitle,
  GroundedPropertyResult,
} from "@/lib/chat-grounding-engine";

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

/**
 * Generate a dynamic, intelligent, context-grounded response using Gemini.
 * Falls back cleanly to deterministic, varied responses if the LLM call times out or errors.
 */
async function generateGroundedAIResponse(params: {
  userMessage: string;
  intent: string;
  properties: GroundedPropertyResult[];
  totalMatches: number;
  suggestions?: any;
  userName: string;
  userRole: string;
  explanation: string;
}): Promise<string | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let systemContext = `You are the AI Real Estate Assistant for Somalia's premier real estate platform.
User Name: ${params.userName}
User Role: ${params.userRole}
Detected Intent: ${params.intent} (${params.explanation})
User Question: "${params.userMessage}"

STRICT DATABASE GROUNDING RULES:
1. NEVER invent, fabricate, or hallucinate properties, prices, or locations.
2. If properties were found (${params.totalMatches} matches), talk specifically and directly about them using their real prices, cities, and features listed below.
3. If 0 properties were found in the requested city or criteria, explicitly state that no properties are currently available for that criteria in the database. Mention the alternatives provided.
4. If the user asked a general or educational real estate question (e.g. difference between villa and townhouse, what is escrow, payment methods, how AI price prediction works), answer it directly, concisely, and informatively in 2 to 4 sentences. DO NOT talk about properties in previous queries.
5. Keep answers natural, professional, concise, and helpful. Use markdown formatting where appropriate.`;

    if (params.properties.length > 0) {
      const summaryList = params.properties
        .map(
          (p, i) =>
            `${i + 1}. Title: "${p.title}" | City: ${p.city} | Price: ${p.formattedPrice} | Type: ${p.typeLabel} | Beds: ${p.bedrooms}, Baths: ${p.bathrooms} | Status: ${p.statusLabel} | Verified Manager: ${p.managerName}`
        )
        .join("\n");
      systemContext += `\n\nREAL PROPERTIES FOUND IN DATABASE:\n${summaryList}`;
    } else if (params.suggestions) {
      systemContext += `\n\nDATABASE SUGGESTIONS:\nNearby Cities: ${params.suggestions.nearbyCities?.join(", ") || "None"}\nAlternative Types: ${params.suggestions.otherAvailableTypes?.join(", ") || "None"}`;
    }

    const prompt = `${systemContext}\n\nPlease generate a direct, helpful, and concise response to the user's specific question now:`;

    // Timeout after 4 seconds to guarantee fast response time
    const responsePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

    const result: any = await Promise.race([responsePromise, timeoutPromise]);
    if (result && result.response) {
      const generated = result.response.text().trim();
      if (generated && generated.length > 10) {
        return generated;
      }
    }
  } catch (error) {
    console.warn("Gemini generative AI grounded fallback triggered:", error);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const {
      message,
      history = [],
      role: requestedRole,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userRole = session?.user?.role || requestedRole || "PUBLIC";
    const userName = session?.user?.name || "there";

    // STEP 1: CLASSIFY USER INTENT FRESHLY FOR THIS MESSAGE
    const intentResult = classifyUserIntent(message, history);

    let reply = "";
    let properties: GroundedPropertyResult[] = [];
    let totalMatches = 0;
    let suggestions: any = undefined;

    switch (intentResult.intent) {
      // 1. GREETING — Reply naturally, DO NOT search database
      case "GREETING": {
        const greetings = [
          `Hello ${userName}! How can I assist you with Somali real estate today? You can ask me to find houses in Mogadishu, apartments in Hargeisa, or ask any question about the housing market.`,
          `Hi ${userName}! Welcome to AI Real Estate. What city or type of property are you interested in exploring?`,
          `Greetings! I'm your AI Real Estate Assistant. Let me know what location, property type, or budget you're curious about!`,
        ];
        reply = greetings[Math.floor(Math.random() * greetings.length)];
        break;
      }

      // 2. BOOKING WORKFLOW
      case "BOOKING": {
        reply = `📅 **Schedule a Property Visit**:\nTo book an in-person viewing or inspection tour, simply click the **"Book Visit"** button directly on any property card below or on its listing page. Our verified managers will coordinate directly with you.`;
        if (intentResult.propertyIdentifier) {
          const matched = await getPropertyDetailsByIdOrTitle(intentResult.propertyIdentifier);
          if (matched) {
            properties = [matched];
            totalMatches = 1;
          }
        }
        break;
      }

      // 3. AVAILABILITY CHECK
      case "AVAILABILITY": {
        if (intentResult.propertyIdentifier) {
          const matched = await getPropertyDetailsByIdOrTitle(intentResult.propertyIdentifier);
          if (matched) {
            properties = [matched];
            totalMatches = 1;
            reply = `**Live Status for "${matched.title}"**:\n\n${matched.statusEmoji} (${matched.statusLabel}).\n\nPrice: **${matched.formattedPrice}** in **${matched.city}**.`;
          } else {
            reply = `I searched our database, but could not locate that specific property ID. Please verify the property reference or browse active listings.`;
          }
        } else {
          reply = `To check real-time availability, please provide the Property Title or ID, or browse our available listings below.`;
        }
        break;
      }

      // 4. PROPERTY DETAILS
      case "PROPERTY_DETAILS": {
        if (intentResult.propertyIdentifier) {
          const matched = await getPropertyDetailsByIdOrTitle(intentResult.propertyIdentifier);
          if (matched) {
            properties = [matched];
            totalMatches = 1;
            reply = `Here are the complete verified specifications for **${matched.title}** (${matched.city}):\n• **Bedrooms**: ${matched.bedrooms} | **Bathrooms**: ${matched.bathrooms}\n• **Area**: ${matched.areaSize} m² | **Land Size**: ${matched.landSize} m²\n• **Status**: ${matched.statusEmoji}\n• **Parking**: ${matched.parkingSpaces} space(s)\n• **Furnished**: ${matched.furnished ? "Yes (Fully Furnished)" : "Unfurnished"}`;
          } else {
            reply = `No matching property details found for that identifier in our database.`;
          }
        } else {
          reply = `Which property would you like details on? You can mention the property title or location.`;
        }
        break;
      }

      // 5. GENERAL QUESTIONS — Answer directly, DO NOT search database
      case "GENERAL_QUESTIONS": {
        const aiAnswer = await generateGroundedAIResponse({
          userMessage: message,
          intent: intentResult.intent,
          properties: [],
          totalMatches: 0,
          userName,
          userRole,
          explanation: intentResult.explanation,
        });

        if (aiAnswer) {
          reply = aiAnswer;
        } else {
          const lower = message.toLowerCase();
          if (lower.includes("villa") && lower.includes("townhouse")) {
            reply = `A **villa** is typically a standalone, luxury private residence with its own private land, perimeter walls, and often a garden or pool. In contrast, a **townhouse** is a multi-story home that shares one or two walls with neighboring homes while having its own private street entrance.`;
          } else if (lower.includes("ai") || lower.includes("price prediction")) {
            reply = `Our platform employs machine learning regression models trained on neighborhood datasets across Mogadishu, Hargeisa, Bosaso, and Garowe to estimate fair market value based on area, bedrooms, age, and infrastructure.`;
          } else if (lower.includes("payment") || lower.includes("escrow")) {
            reply = `We support secure digital transactions and escrow reservations, including local mobile money (EVC Plus, Premier Wallet) integrations. Escrow holds your funds securely until inspection conditions are satisfied.`;
          } else {
            reply = `AI Real Estate is Somalia's advanced property intelligence platform. We offer verified property listings, transparent valuation tools, and direct connections between verified buyers, tenants, and property managers.`;
          }
        }
        break;
      }

      // 6. PROPERTY SEARCH & FOLLOW-UP — Search Database Strictly
      case "PROPERTY_SEARCH":
      case "FOLLOW_UP":
      default: {
        const searchResult = await searchDatabaseProperties(intentResult, 4);
        properties = searchResult.properties;
        totalMatches = searchResult.totalMatches;
        suggestions = searchResult.suggestions;

        // Attempt LLM generation grounded strictly in the database results
        const aiSearchReply = await generateGroundedAIResponse({
          userMessage: message,
          intent: intentResult.intent,
          properties,
          totalMatches,
          suggestions,
          userName,
          userRole,
          explanation: intentResult.explanation,
        });

        if (aiSearchReply) {
          reply = aiSearchReply;
        } else if (properties.length > 0) {
          const filterCriteriaDesc = [
            intentResult.city ? `in **${intentResult.city}**` : "",
            intentResult.propertyType ? `type **${intentResult.propertyType}**` : "",
            intentResult.bedrooms ? `with **${intentResult.bedrooms}+ bedrooms**` : "",
            intentResult.maxPrice ? `under **$${intentResult.maxPrice.toLocaleString()}**` : "",
          ]
            .filter(Boolean)
            .join(", ");

          reply = `Found **${totalMatches} matching ${
            totalMatches === 1 ? "property" : "properties"
          }** in our database${filterCriteriaDesc ? ` ${filterCriteriaDesc}` : ""}.\n\nThese properties match your requested criteria:`;
        } else {
          // STEP 6: IF NOTHING EXISTS IN THE DATABASE
          const targetLoc = intentResult.city ? ` in **${intentResult.city}**` : "";
          reply = `I searched our database, but there are currently no properties available matching your criteria${targetLoc}.\n\nHere are some verified suggestions from our inventory:`;
          if (suggestions?.nearbyCities && suggestions.nearbyCities.length > 0) {
            reply += `\n• **Nearby Cities**: Check active listings in ${suggestions.nearbyCities.join(", ")}.`;
          }
          if (suggestions?.otherAvailableTypes && suggestions.otherAvailableTypes.length > 0) {
            reply += `\n• **Different Property Types**: Explore ${suggestions.otherAvailableTypes.join(" or ")}.`;
          }
          if (suggestions?.suggestHigherBudget) {
            reply += `\n• **Different Budget**: Average properties in this area start around $${suggestions.suggestHigherBudget.toLocaleString()}.`;
          }
        }
        break;
      }
    }

    return NextResponse.json({
      reply,
      properties,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      explanation: intentResult.explanation,
      totalMatches,
      suggestions,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", reply: "Sorry, something went wrong while searching the database." },
      { status: 500 }
    );
  }
}
