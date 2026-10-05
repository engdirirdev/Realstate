/**
 * AIDA Specification Verification Test Suite
 * Tests A through H according to the Gemini Conversation Behavior & Real Estate Agent Specification
 */

import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.ts';
import { initializeConversationState } from '../lib/ai/conversation/state-manager.ts';

async function runTests() {
  console.log('======================================================================');
  console.log(' AIDA SPECIFICATION VERIFICATION SUITE (TESTS A - H)');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      passed++;
      console.log(`✓ [PASS] ${testName}`);
    } else {
      failed++;
      console.error(`✗ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Test A — Greeting
  // User: "Asc"
  // Expected: Natural Somali greeting.
  // ---------------------------------------------------------------------------
  console.log('--- Test A: Greeting ---');
  let stateA = initializeConversationState('session-test-a', 'so');
  const resA = await processConversationalTurn({
    sessionId: 'session-test-a',
    message: 'Asc',
    language: 'so',
    initialState: stateA,
  });
  assert(resA.responseType === 'GREETING', 'Test A: Intent is GREETING');
  assert(
    resA.reply.includes('Waad salaaman tahay') || resA.reply.includes('Wa calaykum') || resA.reply.includes('salaam'),
    'Test A: Reply contains natural Somali greeting',
    `Got: ${resA.reply}`
  );
  console.log(`Reply: "${resA.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test B — Search
  // User: "Waxaan rabaa apartment 3 bedroom ah oo Hodan ah."
  // Expected: AIDA understands location, property type and bedrooms.
  // ---------------------------------------------------------------------------
  console.log('--- Test B: Search ---');
  let stateB = initializeConversationState('session-test-b', 'so');
  const resB = await processConversationalTurn({
    sessionId: 'session-test-b',
    message: 'Waxaan rabaa apartment 3 bedroom ah oo Hodan ah.',
    language: 'so',
    initialState: stateB,
  });
  const slotsB = resB.state.slots;
  assert(slotsB.district === 'Hodan' || slotsB.city === 'Hodan' || slotsB.city === 'Mogadishu', 'Test B: Location understood (Hodan)');
  assert(slotsB.propertyType === 'APARTMENT', 'Test B: Property type understood (APARTMENT)', `Got: ${slotsB.propertyType}`);
  assert(slotsB.bedrooms === 3, 'Test B: Bedrooms understood (3)', `Got: ${slotsB.bedrooms}`);
  console.log(`Slots: ${JSON.stringify(slotsB)}`);
  console.log(`Reply: "${resB.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test C — Budget Context
  // Follow up to Test B: User says "$400"
  // Expected: AIDA associates $400 with the active search.
  // ---------------------------------------------------------------------------
  console.log('--- Test C: Budget Context ---');
  let stateC = resB.state;
  const resC = await processConversationalTurn({
    sessionId: 'session-test-b',
    message: '$400',
    language: 'so',
    initialState: stateC,
  });
  const slotsC = resC.state.slots;
  assert(slotsC.maxPrice === 400, 'Test C: Budget $400 associated with active search', `Got: ${slotsC.maxPrice}`);
  assert(slotsC.propertyType === 'APARTMENT', 'Test C: Property type retained from previous turn', `Got: ${slotsC.propertyType}`);
  assert(slotsC.bedrooms === 3, 'Test C: Bedrooms retained from previous turn', `Got: ${slotsC.bedrooms}`);
  assert(slotsC.district === 'Hodan', 'Test C: Location retained from previous turn', `Got: ${slotsC.district}`);
  console.log(`Slots after budget: ${JSON.stringify(slotsC)}`);
  console.log(`Reply: "${resC.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test D — Property Reference
  // User: "Kan labaad ma furnished baa?"
  // Expected: AIDA resolves "kan labaad" to the second previously returned property.
  // ---------------------------------------------------------------------------
  console.log('--- Test D: Property Reference ---');
  let stateD = initializeConversationState('session-test-d', 'so');
  stateD.activeResultSet = [
    { rank: 1, id: 'prop-1', title: 'Hodan Villa', price: 600, bedrooms: 3, bathrooms: 2, furnished: false, parking: true, status: 'APPROVED' },
    { rank: 2, id: 'prop-2', title: 'Hodan Apartment', price: 400, bedrooms: 3, bathrooms: 2, furnished: true, parking: false, status: 'APPROVED' },
    { rank: 3, id: 'prop-3', title: 'Hodan Studio', price: 300, bedrooms: 1, bathrooms: 1, furnished: null, parking: null, status: 'APPROVED' },
  ];
  stateD.referencedPropertyId = 'prop-2';
  const resD = await processConversationalTurn({
    sessionId: 'session-test-d',
    message: 'Kan labaad ma furnished baa?',
    language: 'so',
    initialState: stateD,
  });
  assert(resD.responseType === 'PROPERTY_DETAIL', 'Test D: Response type is PROPERTY_DETAIL');
  assert(
    resD.reply.includes('labaad') && (resD.reply.includes('Haa') || resD.reply.includes('alaab') || resD.reply.includes('furnished')),
    'Test D: Resolves second property and answers furnished status correctly',
    `Got: ${resD.reply}`
  );
  console.log(`Reply: "${resD.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test E — Correction
  // User: "Hodan ayaan rabaa." -> then "Maya, Wadajir ayaan rabaa."
  // Expected: Location changes from Hodan to Wadajir.
  // ---------------------------------------------------------------------------
  console.log('--- Test E: Correction ---');
  let stateE = initializeConversationState('session-test-e', 'so');
  const resE1 = await processConversationalTurn({
    sessionId: 'session-test-e',
    message: 'Hodan ayaan rabaa.',
    language: 'so',
    initialState: stateE,
  });
  assert(resE1.state.slots.district === 'Hodan', 'Test E: Initial district is Hodan');
  const resE2 = await processConversationalTurn({
    sessionId: 'session-test-e',
    message: 'Maya, Wadajir ayaan rabaa.',
    language: 'so',
    initialState: resE1.state,
  });
  assert(resE2.state.slots.district === 'Wadajir', 'Test E: Corrected district is Wadajir', `Got: ${resE2.state.slots.district}`);
  console.log(`District before: ${resE1.state.slots.district}, after: ${resE2.state.slots.district}`);
  console.log(`Reply: "${resE2.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test F — Missing Data
  // User: "Parking ma leeyahay?" against property #3 where parking is null
  // Expected: Answer only if parking information exists in actual property data.
  // ---------------------------------------------------------------------------
  console.log('--- Test F: Missing Data ---');
  let stateF = initializeConversationState('session-test-f', 'so');
  stateF.activeResultSet = [
    { rank: 1, id: 'prop-3', title: 'Hodan Studio', price: 300, bedrooms: 1, bathrooms: 1, furnished: null, parking: null, status: 'APPROVED' },
  ];
  stateF.referencedPropertyId = 'prop-3';
  const resF = await processConversationalTurn({
    sessionId: 'session-test-f',
    message: 'Parking ma leeyahay?',
    language: 'so',
    initialState: stateF,
  });
  assert(
    resF.reply.includes('kama muuqato') || resF.reply.includes('kama xaqiijin') || resF.reply.includes('unavailable') || resF.reply.includes('not available'),
    'Test F: Missing data correctly identified without hallucination',
    `Got: ${resF.reply}`
  );
  console.log(`Reply: "${resF.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test G — Context Across Separate Messages
  // Turn 1: "3 bedroom"
  // Turn 2: "$500"
  // Turn 3: "Hodan"
  // Expected: AIDA maintains all three requirements across separate messages.
  // ---------------------------------------------------------------------------
  console.log('--- Test G: Multi-turn Context ---');
  let stateG = initializeConversationState('session-test-g', 'so');
  const resG1 = await processConversationalTurn({
    sessionId: 'session-test-g',
    message: '3 bedroom',
    language: 'so',
    initialState: stateG,
  });
  const resG2 = await processConversationalTurn({
    sessionId: 'session-test-g',
    message: '$500',
    language: 'so',
    initialState: resG1.state,
  });
  const resG3 = await processConversationalTurn({
    sessionId: 'session-test-g',
    message: 'Hodan',
    language: 'so',
    initialState: resG2.state,
  });
  const slotsG = resG3.state.slots;
  assert(slotsG.bedrooms === 3, 'Test G: Bedrooms (3) retained', `Got: ${slotsG.bedrooms}`);
  assert(slotsG.maxPrice === 500, 'Test G: Budget ($500) retained', `Got: ${slotsG.maxPrice}`);
  assert(slotsG.district === 'Hodan', 'Test G: Location (Hodan) retained', `Got: ${slotsG.district}`);
  console.log(`Slots G after 3 turns: ${JSON.stringify(slotsG)}`);
  console.log(`Reply: "${resG3.reply}"\n`);

  // ---------------------------------------------------------------------------
  // Test H — Mixed Language
  // User: "Waxaan rabaa 2 bedroom apartment oo furnished ah."
  // Expected: Correctly understand the mixed Somali/English real-estate terminology.
  // ---------------------------------------------------------------------------
  console.log('--- Test H: Mixed Language ---');
  let stateH = initializeConversationState('session-test-h', 'so');
  const resH = await processConversationalTurn({
    sessionId: 'session-test-h',
    message: 'Waxaan rabaa 2 bedroom apartment oo furnished ah.',
    language: 'so',
    initialState: stateH,
  });
  const slotsH = resH.state.slots;
  assert(slotsH.bedrooms === 2, 'Test H: 2 bedroom understood from mixed query', `Got: ${slotsH.bedrooms}`);
  assert(slotsH.propertyType === 'APARTMENT', 'Test H: apartment understood from mixed query', `Got: ${slotsH.propertyType}`);
  assert(slotsH.furnished === true, 'Test H: furnished understood from mixed query', `Got: ${slotsH.furnished}`);
  console.log(`Slots H: ${JSON.stringify(slotsH)}`);
  console.log(`Reply: "${resH.reply}"\n`);

  console.log('======================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal error running tests:', e);
  process.exit(1);
});
