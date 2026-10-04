/**
 * AIDA — Master End-to-End User Dialogue Test
 *
 * Verifies the exact conversation requested by the user:
 * 1. User: "Asc"
 *    AIDA: "Waad salaaman tahay 👋 Ku soo dhowow Kiro-Maal..."
 * 2. User: "Ma hubtaa midaas?"
 *    AIDA: "Haa 😊 Waxaan ahay Kiro-Maal Real Estate Assistant..."
 * 3. User: "Haye, waxaan rabaa apartment 3 bedroom ah."
 *    AIDA: [waa inuu kaliya weydiiyaa xogta weli maqan - e.g. location/city]
 * 4. User: "Hodan."
 *    AIDA: [waa inuu xasuustaa 3-bedroom + apartment + Hodan, asks for missing budget]
 * 5. User: "Budget $400."
 *    AIDA: [waa inuu search sameeyaa]
 * 6. User: "Kan labaad parking ma leeyahay?"
 *    AIDA: [waa inuu property #2 aqoonsadaa and answer parking]
 * 7. User: "Maya, kii ugu horeeyey ayaan ula jeedaa."
 *    AIDA: [waa inuu property #1 u wareegaa]
 * 8. User: "Kan ma furnished baa?"
 *    AIDA: [waa inuu isla property #1 ka jawaabaa]
 * 9. User: "$350 ayaan awoodaa."
 *    AIDA: [waa inuu budget update sameeyaa isagoo ilaalinaya apartment + 3 bedroom + Hodan]
 */

import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('======================================================================');
console.log(' AIDA — MASTER 9-TURN USER CONVERSATION ACCEPTANCE TEST');
console.log('======================================================================\n');

const sessionId = 'user-conversation-' + Date.now();
let currentState = null;

// ---------------------------------------------------------------------------
// TURN 1: User says "Asc"
// ---------------------------------------------------------------------------
console.log('[TURN 1] User: "Asc"');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Asc',
    language: 'so',
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply.substring(0, 80)}..."`);
  assert(res.responseType === 'GREETING', `Response type is GREETING (got ${res.responseType})`);
  assert(res.reply.includes('Ku soo dhowow Kiro-Maal') || res.reply.includes('Waad salaaman tahay'), `Contains welcoming greeting`);
  assert(res.shouldRenderPropertyCards === false, `Property cards suppressed`);
}

// ---------------------------------------------------------------------------
// TURN 2: User says "Ma hubtaa midaas?"
// ---------------------------------------------------------------------------
console.log('\n[TURN 2] User: "Ma hubtaa midaas?"');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Ma hubtaa midaas?',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply.substring(0, 80)}..."`);
  assert(res.responseType === 'CONFIRMATION', `Response type is CONFIRMATION (got ${res.responseType})`);
  assert(res.reply.includes('Haa') && res.reply.includes('Kiro-Maal Real Estate Assistant'), `Affirms AIDA Real Estate identity`);
  assert(!res.reply.includes('Magaaladee'), `Does NOT immediately ask questionnaire question`);
  assert(res.shouldRenderPropertyCards === false, `Property cards suppressed`);
}

// ---------------------------------------------------------------------------
// TURN 3: User says "Haye, waxaan rabaa apartment 3 bedroom ah."
// ---------------------------------------------------------------------------
console.log('\n[TURN 3] User: "Haye, waxaan rabaa apartment 3 bedroom ah."');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Haye, waxaan rabaa apartment 3 bedroom ah.',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.state.slots.propertyType === 'APARTMENT', `Extracted propertyType APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Extracted 3 bedrooms`);
  assert(res.responseType === 'CLARIFICATION', `Response type is CLARIFICATION (interview for missing slot)`);
  assert(res.missingSlots?.includes('city'), `Identifies missing location/city (got missingSlots: ${res.missingSlots?.join(', ')})`);
  assert(res.reply.includes('Magaalo') || res.reply.includes('magaalo'), `Asks only for missing location`);
  assert(!res.reply.includes('qol'), `Does NOT ask again for bedroom count`);
}

// ---------------------------------------------------------------------------
// TURN 4: User says "Hodan."
// ---------------------------------------------------------------------------
console.log('\n[TURN 4] User: "Hodan."');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Hodan.',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.state.slots.district === 'Hodan', `District set to Hodan (got ${res.state.slots.district})`);
  assert(res.state.slots.city === 'Mogadishu', `City mapped to Mogadishu (got ${res.state.slots.city})`);
  assert(res.state.slots.propertyType === 'APARTMENT', `Remembered propertyType APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Remembered 3 bedrooms`);
  assert(res.responseType === 'CLARIFICATION', `Response type is CLARIFICATION (budget missing)`);
  assert(res.missingSlots?.includes('budget'), `Identifies missing budget`);
  assert(res.reply.includes('Miisaaniyadda') || res.reply.includes('budget'), `Asks for missing budget`);
  assert(!res.reply.includes('Magaalo'), `Does NOT re-ask for location`);
}

// ---------------------------------------------------------------------------
// TURN 5: User says "Budget $400."
// ---------------------------------------------------------------------------
console.log('\n[TURN 5] User: "Budget $400."');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Budget $400.',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply.substring(0, 100)}..."`);
  console.log(`  Properties found: ${res.properties.length}`);
  assert(res.state.slots.maxPrice === 400, `Budget captured as 400 (got ${res.state.slots.maxPrice})`);
  assert(res.state.slots.district === 'Hodan', `District preserved as Hodan`);
  assert(res.state.slots.propertyType === 'APARTMENT', `PropertyType preserved as APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Bedrooms preserved as 3`);
  assert(res.responseType === 'PROPERTY_RESULTS', `Response type is PROPERTY_RESULTS`);
  assert(res.searchReadiness === 'READY', `Search readiness is READY`);
  assert(res.properties.length > 0, `Search returned verified listings`);
  assert(res.state.activeResultSet.length > 0, `activeResultSet populated in state`);
}

// ---------------------------------------------------------------------------
// TURN 6: User says "Kan labaad parking ma leeyahay?"
// ---------------------------------------------------------------------------
console.log('\n[TURN 6] User: "Kan labaad parking ma leeyahay?"');
{
  const res = await processConversationalTurn({
    sessionId,
    message: 'Kan labaad parking ma leeyahay?',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.responseType === 'PROPERTY_DETAIL', `Response type is PROPERTY_DETAIL`);
  assert(res.state.referencedPropertyId !== undefined, `referencedPropertyId is set in state`);
  assert(res.reply.includes('labaad') && (res.reply.includes('parking') || res.reply.includes('Parking')), `Acknowledged property #2 and parking`);
  assert(res.shouldRenderPropertyCards === false, `Property cards suppressed for attribute query`);
}

// ---------------------------------------------------------------------------
// TURN 7: User says "Maya, kii ugu horeeyey ayaan ula jeedaa."
// ---------------------------------------------------------------------------
console.log('\n[TURN 7] User: "Maya, kii ugu horeeyey ayaan ula jeedaa."');
{
  const prop1 = currentState.activeResultSet.find(p => p.rank === 1) || currentState.activeResultSet[0];
  const res = await processConversationalTurn({
    sessionId,
    message: 'Maya, kii ugu horeeyey ayaan ula jeedaa.',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply.substring(0, 100)}..."`);
  assert(res.state.referencedPropertyId === prop1.id, `Shifted referencedPropertyId to property #1 (${prop1.id})`);
  assert(res.responseType === 'PROPERTY_DETAIL' || res.responseType === 'PROPERTY_REFERENCE', `Recognized reference shift (got ${res.responseType})`);
  assert(res.reply.includes('#1') || res.reply.includes('koowaad') || res.reply.includes(prop1.title) || res.reply.includes('hore'), `Refers to property #1`);
}

// ---------------------------------------------------------------------------
// TURN 8: User says "Kan ma furnished baa?"
// ---------------------------------------------------------------------------
console.log('\n[TURN 8] User: "Kan ma furnished baa?"');
{
  const prop1 = currentState.activeResultSet.find(p => p.id === currentState.referencedPropertyId);
  const res = await processConversationalTurn({
    sessionId,
    message: 'Kan ma furnished baa?',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply}"`);
  assert(res.responseType === 'PROPERTY_DETAIL', `Response type is PROPERTY_DETAIL`);
  assert(res.state.referencedPropertyId === prop1.id, `Remained focused on property #1`);
  assert(res.reply.includes('alaab') || res.reply.includes('Furnished') || res.reply.includes('furnished'), `Answers furnished status for property #1`);
  assert(res.shouldRenderPropertyCards === false, `Property cards suppressed`);
}

// ---------------------------------------------------------------------------
// TURN 9: User says "$350 ayaan awoodaa."
// ---------------------------------------------------------------------------
console.log('\n[TURN 9] User: "$350 ayaan awoodaa."');
{
  const res = await processConversationalTurn({
    sessionId,
    message: '$350 ayaan awoodaa.',
    language: 'so',
    initialState: currentState,
  });
  currentState = res.state;

  console.log(`  AIDA: "${res.reply.substring(0, 100)}..."`);
  assert(res.state.slots.maxPrice === 350, `Budget updated to 350 (got ${res.state.slots.maxPrice})`);
  assert(res.state.slots.propertyType === 'APARTMENT', `PropertyType preserved as APARTMENT`);
  assert(res.state.slots.bedrooms === 3, `Bedrooms preserved as 3`);
  assert(res.state.slots.district === 'Hodan', `District preserved as Hodan`);
  assert(res.state.slots.city === 'Mogadishu', `City preserved as Mogadishu`);
  assert(res.responseType === 'PROPERTY_RESULTS' || res.responseType === 'NO_RESULTS', `Executed updated search with new budget (got ${res.responseType})`);
}

console.log('\n======================================================================');
console.log(` FINAL TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
