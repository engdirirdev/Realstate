const fs = require('fs');
const path = require('path');

// 1. Update lib/ai/conversation/chat-engine.ts
const chatEnginePath = path.join(__dirname, '..', 'lib', 'ai', 'conversation', 'chat-engine.ts');
let chatEngineCode = fs.readFileSync(chatEnginePath, 'utf8');

// Increase DB timeout from 800ms to 3000ms
chatEngineCode = chatEngineCode.replace(
  'new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 800))',
  'new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3000))'
);

// Enhance city resolution in executePropertySearchTool
const oldCityCode = `  const targetCity = toolArgs.city || state.slots.city;
  if (targetCity) {
    searchFilter.city = { contains: targetCity };
  }`;

const newCityCode = `  const rawCity = toolArgs.city || state.slots.city;
  let targetCity = rawCity;
  if (rawCity) {
    const loc = resolveLocation(rawCity);
    if (loc?.canonicalCity) {
      targetCity = loc.canonicalCity;
    }
  }
  if (targetCity) {
    if (targetCity.toLowerCase() === "caabudwaaq" || targetCity.toLowerCase() === "abudwak") {
      searchFilter.OR = [
        { city: { contains: "Caabudwaaq" } },
        { city: { contains: "Abudwak" } },
      ];
    } else {
      searchFilter.city = { contains: targetCity };
    }
  }`;

chatEngineCode = chatEngineCode.replace(oldCityCode, newCityCode);
fs.writeFileSync(chatEnginePath, chatEngineCode, 'utf8');
console.log('Updated lib/ai/conversation/chat-engine.ts');

// 2. Update lib/ai/orchestration/grounding-validator.ts
const validatorPath = path.join(__dirname, '..', 'lib', 'ai', 'orchestration', 'grounding-validator.ts');
let validatorCode = fs.readFileSync(validatorPath, 'utf8');

const additionalGroundingChecks = `
  // 4. ELEVATOR / LIFT VALIDATION
  const assertsElevator =
    /\\b(wiish|wiishka|lift|elevator|leeyahay wiish|has an elevator)\\b/i.test(text) &&
    !text.includes("kama muuqato") &&
    !text.includes("ma laha") &&
    !text.includes("no elevator") &&
    !text.includes("no lift");

  if (assertsElevator) {
    const verifiedHasElevator = activeProp
      ? Boolean(activeProp.description?.toLowerCase().includes("wiish") || activeProp.description?.toLowerCase().includes("elevator") || activeProp.description?.toLowerCase().includes("lift"))
      : verifiedProperties.some((p) => p.description?.toLowerCase().includes("wiish") || p.description?.toLowerCase().includes("elevator") || p.description?.toLowerCase().includes("lift"));

    if (!verifiedHasElevator) {
      return {
        isValid: false,
        reason: "Claimed elevator/lift amenity which is not verified in database listing.",
        hallucinatedFeature: "elevator",
      };
    }
  }

  // 5. BALCONY / TERRACE VALIDATION
  const assertsBalcony =
    /\\b(balkoon|balcony|terrace|balkoonka|leeyahay balkoon|has a balcony)\\b/i.test(text) &&
    !text.includes("kama muuqato") &&
    !text.includes("ma laha") &&
    !text.includes("no balcony");

  if (assertsBalcony) {
    const verifiedHasBalcony = activeProp
      ? Boolean(activeProp.description?.toLowerCase().includes("balcony") || activeProp.description?.toLowerCase().includes("balkoon"))
      : verifiedProperties.some((p) => p.description?.toLowerCase().includes("balcony") || p.description?.toLowerCase().includes("balkoon"));

    if (!verifiedHasBalcony) {
      return {
        isValid: false,
        reason: "Claimed balcony amenity which is not verified in database listing.",
        hallucinatedFeature: "balcony",
      };
    }
  }
`;

if (!validatorCode.includes('// 4. ELEVATOR / LIFT VALIDATION')) {
  validatorCode = validatorCode.replace(
    '  return { isValid: true };',
    additionalGroundingChecks + '\n  return { isValid: true };'
  );
  fs.writeFileSync(validatorPath, validatorCode, 'utf8');
  console.log('Updated lib/ai/orchestration/grounding-validator.ts with elevator and balcony grounding');
}

// 3. Update lib/ai/conversation/state-manager.ts
const stateManagerPath = path.join(__dirname, '..', 'lib', 'ai', 'conversation', 'state-manager.ts');
let stateManagerCode = fs.readFileSync(stateManagerPath, 'utf8');

const oldValuationPattern = `    lower.includes("valuation") ||
    lower.includes("appraisal") ||
    lower.includes("predict price") ||
    lower.includes("qiimee") ||
    lower.includes("qiyaas qiimaha") ||
    lower.includes("تقييم")`;

const newValuationPattern = `    lower.includes("valuation") ||
    lower.includes("appraisal") ||
    lower.includes("predict price") ||
    lower.includes("qiimee") ||
    lower.includes("qiyaas qiimaha") ||
    lower.includes("qiimihiisu waa imisa") ||
    lower.includes("qiimaha suuqa") ||
    lower.includes("imisaa lagu qiyaasaa") ||
    lower.includes("imisaa lagu qiyaasi karaa") ||
    lower.includes("market price") ||
    lower.includes("market value") ||
    lower.includes("تقييم")`;

stateManagerCode = stateManagerCode.replace(oldValuationPattern, newValuationPattern);
fs.writeFileSync(stateManagerPath, stateManagerCode, 'utf8');
console.log('Updated lib/ai/conversation/state-manager.ts with expanded valuation patterns');

