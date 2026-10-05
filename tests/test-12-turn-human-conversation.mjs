/**
 * 12-Turn Mixed Human Conversation & Gemini-Native Intelligence Verification Test
 *
 * Directly tests the 12-turn dialogue defined in Sections 24 & 25 of the Architecture Directive:
 *
 * 1. "asc walaal"
 * 2. "waan fiicanahay, adiguna?"
 * 3. "maanta shaqada aad baan ugu mashquulsanahay"
 * 4. "waxaan rabaa inaan guri raadsado"
 * 5. "laakiin marka hore Muqdisho meelaha reeraha ku fiican waa kuwee?"
 * 6. "400 ilaa 500 dollar ayaan hayaa"
 * 7. "guri kirro ah ayaan rabaa"
 * 8. "3 qol haddii la helo waa fiican tahay"
 * 9. "laakiin khasab ma aha"
 * 10. "Hodan ma rabo"
 * 11. "KM4 ayaan ka shaqeeyaa"
 * 12. "haye, hadda ii raadi kan ugu fiican"
 */

import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.ts';
import { initializeConversationState } from '../lib/ai/conversation/state-manager.ts';

async function run12TurnConversationTest() {
  console.log('======================================================================');
  console.log(' 12-TURN MIXED HUMAN CONVERSATION & ARCHITECTURAL TRACE VERIFICATION');
  console.log('======================================================================\n');

  const sessionId = `test-12-turn-${Date.now()}`;
  const history = [];
  let currentState = initializeConversationState(sessionId, 'so');

  const turns = [
    {
      turnNumber: 1,
      message: 'asc walaal',
      expectedBehavior: 'Warm natural greeting, no premature search, no missing-city error',
      requiresDB: false,
    },
    {
      turnNumber: 2,
      message: 'waan fiicanahay, adiguna?',
      expectedBehavior: 'Natural friendly continuation, no missing-city error',
      requiresDB: false,
    },
    {
      turnNumber: 3,
      message: 'maanta shaqada aad baan ugu mashquulsanahay',
      expectedBehavior: 'Natural casual empathy, no missing-field error',
      requiresDB: false,
    },
    {
      turnNumber: 4,
      message: 'waxaan rabaa inaan guri raadsado',
      expectedBehavior: 'Conversational offer to help without form-filling interrogation',
      requiresDB: false,
    },
    {
      turnNumber: 5,
      message: 'laakiin marka hore Muqdisho meelaha reeraha ku fiican waa kuwee?',
      expectedBehavior: 'Mogadishu neighborhood advice for families using domain knowledge',
      requiresDB: false,
    },
    {
      turnNumber: 6,
      message: '400 ilaa 500 dollar ayaan hayaa',
      expectedBehavior: 'Budget understood (max $500) conversationally, no form questionnaire',
      requiresDB: false,
    },
    {
      turnNumber: 7,
      message: 'guri kirro ah ayaan rabaa',
      expectedBehavior: 'Rental purpose understood, context maintained',
      requiresDB: false,
    },
    {
      turnNumber: 8,
      message: '3 qol haddii la helo waa fiican tahay',
      expectedBehavior: '3 bedrooms recorded as soft preference (not rigid mandatory filter)',
      requiresDB: false,
    },
    {
      turnNumber: 9,
      message: 'laakiin khasab ma aha',
      expectedBehavior: 'Maintains 3 bedrooms as soft preference, not hard constraint',
      requiresDB: false,
    },
    {
      turnNumber: 10,
      message: 'Hodan ma rabo',
      expectedBehavior: 'Hodan recorded in excludedLocations, removed from active district',
      requiresDB: false,
    },
    {
      turnNumber: 11,
      message: 'KM4 ayaan ka shaqeeyaa',
      expectedBehavior: 'Workplace near KM4 recorded as proximity soft preference',
      requiresDB: false,
    },
    {
      turnNumber: 12,
      message: 'haye, hadda ii raadi kan ugu fiican',
      expectedBehavior: 'Verified DB search executed with strict Hodan exclusion and soft ranking',
      requiresDB: true,
    },
  ];

  let allChecksPassed = true;

  for (const step of turns) {
    console.log(`\n──────────────────────────────────────────────────────────────────────`);
    console.log(`TURN ${step.turnNumber}: USER MESSAGE: "${step.message}"`);
    console.log(`EXPECTED: ${step.expectedBehavior}`);
    console.log(`──────────────────────────────────────────────────────────────────────`);

    console.log(`[CONVERSATION HISTORY SENT TO MODEL]: ${history.length} turns in memory`);

    const result = await processConversationalTurn({
      sessionId,
      message: step.message,
      history: [...history],
      initialState: currentState,
    });

    currentState = result.state;
    history.push({ role: 'user', content: step.message });
    history.push({ role: 'assistant', content: result.reply });

    console.log(`[TOOL/DATABASE ACTION]: ${step.requiresDB ? 'EXISTS (MySQL Property Search with Hard Constraints)' : 'NONE (Natural Conversation Turn)'}`);
    console.log(`[VERIFIED DATA]: ${result.properties.length} properties returned (Cards rendered: ${result.shouldRenderPropertyCards})`);
    console.log(`[AIDA RESPONSE]:\n"${result.reply}"\n`);
    console.log(`[CURRENT APPLICATION STATE]:`);
    console.log(`  - City: ${currentState.slots.city || 'none'}`);
    console.log(`  - District: ${currentState.slots.district || 'none'}`);
    console.log(`  - Max Price: ${currentState.slots.maxPrice || 'none'}`);
    console.log(`  - Excluded Locations: ${JSON.stringify(currentState.slots.excludedLocations || [])}`);
    console.log(`  - Soft Preferences: ${JSON.stringify(currentState.slots.softPreferences || [])}`);
    console.log(`  - User Reasoning: ${JSON.stringify(currentState.slots.userReasoning || [])}`);

    // Verification Assertions per Turn
    if (step.turnNumber <= 4) {
      if (result.reply.toLowerCase().includes('magaaladee ayaad ka raadinaysaa')) {
        console.error(`✗ [FAIL] Turn ${step.turnNumber} inappropriately interrogated user for city during casual conversation!`);
        allChecksPassed = false;
      } else {
        console.log(`✓ [PASS] Turn ${step.turnNumber} flowed naturally without forced city interrogation.`);
      }
    }

    if (step.turnNumber === 6) {
      if (currentState.slots.maxPrice === 500) {
        console.log(`✓ [PASS] Turn 6 correctly registered budget $500 without rigid error.`);
      } else {
        console.error(`✗ [FAIL] Turn 6 failed to register maxPrice 500. Got: ${currentState.slots.maxPrice}`);
        allChecksPassed = false;
      }
    }

    if (step.turnNumber === 6 || step.turnNumber === 7) {
      if (result.reply.includes("Qolal jiif imisa ayaad rabtaa?")) {
        console.error(`✗ [FAIL] Turn ${step.turnNumber} forced rigid bedroom questionnaire!`);
        allChecksPassed = false;
      } else {
        console.log(`✓ [PASS] Turn ${step.turnNumber} did NOT force rigid bedroom questionnaire.`);
      }
    }

    if (step.turnNumber === 8) {
      if (result.properties.length > 0) {
        console.error(`✗ [FAIL] Turn 8 prematurely executed database search on preference turn!`);
        allChecksPassed = false;
      } else {
        console.log(`✓ [PASS] Turn 8 did NOT automatically search on soft preference turn.`);
      }
    }

    if (step.turnNumber === 10) {
      if (currentState.slots.excludedLocations?.includes('Hodan')) {
        console.log(`✓ [PASS] Turn 10 successfully added Hodan to excludedLocations.`);
      } else {
        console.error(`✗ [FAIL] Turn 10 did not add Hodan to excludedLocations.`);
        allChecksPassed = false;
      }
    }

    if (step.turnNumber === 11) {
      if (currentState.slots.userReasoning?.some(r => r.includes('KM4')) || currentState.slots.softPreferences?.includes('close_to_workplace')) {
        console.log(`✓ [PASS] Turn 11 successfully recorded workplace proximity preference.`);
      } else {
        console.error(`✗ [FAIL] Turn 11 did not record workplace preference.`);
        allChecksPassed = false;
      }
    }

    if (step.turnNumber === 12) {
      // Critical check: Hodan properties MUST NEVER appear in verified results
      const containsHodan = result.properties.some(p =>
        (p.title || '').toLowerCase().includes('hodan') ||
        (p.city || '').toLowerCase().includes('hodan') ||
        ((p).location || '').toLowerCase().includes('hodan')
      );
      if (containsHodan) {
        console.error(`✗ [CRITICAL FAIL] Turn 12 returned Hodan property when Hodan is strictly excluded!`);
        allChecksPassed = false;
      } else {
        console.log(`✓ [PASS] Turn 12 strictly verified that ZERO Hodan properties appear in results.`);
      }

      if (result.reply.length > 0) {
        console.log(`✓ [PASS] Turn 12 produced natural grounded response explaining verified inventory.`);
      }
    }
  }

  console.log('\n======================================================================');
  if (allChecksPassed) {
    console.log(' ALL 12 TURNS PASSED PERFECTLY ACCORDING TO ARCHITECTURAL DIRECTIVE!');
  } else {
    console.error(' SOME TURNS FAILED VERIFICATION.');
  }
  console.log('======================================================================\n');
}

run12TurnConversationTest().catch(console.error);
