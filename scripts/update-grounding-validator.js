const fs = require('fs');
const path = require('path');

const validatorPath = path.join(__dirname, '..', 'lib', 'ai', 'orchestration', 'grounding-validator.ts');
let code = fs.readFileSync(validatorPath, 'utf8');

const targetStr = '  if (assertsFurnished) {';
const insertBefore = '  return { isValid: true };\n}';

const additionalChecks = `  // 4. ELEVATOR / LIFT VALIDATION
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

  return { isValid: true };
}
`;

const lastReturnIdx = code.lastIndexOf('  return { isValid: true };');
if (lastReturnIdx !== -1) {
  code = code.slice(0, lastReturnIdx) + additionalChecks;
  fs.writeFileSync(validatorPath, code, 'utf8');
  console.log('Appended elevator and balcony grounding checks successfully');
}

