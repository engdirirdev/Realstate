/**
 * Test Suite: Advanced Context-Aware Intent Engine (AIDA)
 * Verifies all 10 intent categories:
 *  1. REAL_ESTATE_SEARCH
 *  2. REAL_ESTATE_FOLLOW_UP
 *  3. PROPERTY_REFERENCE
 *  4. CONFIRMATION_REQUEST
 *  5. CLARIFICATION_REQUEST
 *  6. CORRECTION
 *  7. REQUIREMENT_UPDATE
 *  8. CASUAL_CONVERSATION
 *  9. OUT_OF_SCOPE
 * 10. AMBIGUOUS
 *
 * Verifies multi-turn memory, reference resolution, slot preservation,
 * and context overriding keywords.
 */

import { detectContextAwareIntent, updateConversationState, initializeConversationState } from '../lib/ai/conversation/state-manager.ts';
import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.ts';
import { extractEntities } from '../lib/ai/nlu/entity-extractor.ts';
import { classifyIntent } from '../lib/ai/nlu/intent-classifier.ts';

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

function applyStateUpdate(stateObj, message) {
  const entities = extractEntities(message);
  const intent = classifyIntent(message).intent;
  const { state: updated } = updateConversationState(stateObj, entities, message, intent);
  return updated;
}

function detectIntent(userMessage, state = null, lastAssistantMessage = null) {
  return detectContextAwareIntent(userMessage, state, null, lastAssistantMessage);
}

console.log('======================================================================');
console.log(' TEST SUITE: KIRO-MAAL AIDA CONTEXT-AWARE INTENT ENGINE');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// 1. Direct Intent Detection Tests (detectContextAwareIntent)
// ---------------------------------------------------------------------------
console.log('[CATEGORY 1 & 2] REAL_ESTATE_SEARCH & FOLLOW_UP');
{
  const searchMsg1 = 'Waxaan rabaa guri Hodan ah.';
  const res1 = detectIntent(searchMsg1, {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  });
  assert(res1.intent === 'REAL_ESTATE_SEARCH', `Search intent detected for '${searchMsg1}' (got ${res1.intent})`);

  const searchMsg2 = 'Apartment $400 ah ii raadi.';
  const res2 = detectIntent(searchMsg2, {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  });
  assert(res2.intent === 'REAL_ESTATE_SEARCH', `Search intent detected for '${searchMsg2}' (got ${res2.intent})`);

  const followUp1 = 'Parking ma leeyahay?';
  const res3 = detectIntent(followUp1, {
    activeTopic: 'real_estate',
    activeResultSet: [{ id: 'p1', title: 'Apt' }],
    slots: { city: 'Mogadishu' },
    history: []
  });
  assert(res3.intent === 'REAL_ESTATE_FOLLOW_UP', `Follow-up detected for '${followUp1}' (got ${res3.intent})`);

  const followUp2 = 'Qiimihiisu waa imisa?';
  const res4 = detectIntent(followUp2, {
    activeTopic: 'real_estate',
    activeResultSet: [{ id: 'p1', title: 'Apt' }],
    slots: { city: 'Mogadishu' },
    history: []
  });
  assert(res4.intent === 'REAL_ESTATE_FOLLOW_UP', `Follow-up detected for '${followUp2}' (got ${res4.intent})`);
}

console.log('\n[CATEGORY 3] PROPERTY_REFERENCE Resolution');
{
  const ref1 = 'Kan labaad';
  const resRef1 = detectIntent(ref1, {
    activeTopic: 'real_estate',
    activeResultSet: [{ id: 'p1' }, { id: 'p2' }],
    slots: {},
    history: []
  });
  assert(resRef1.intent === 'PROPERTY_REFERENCE', `Reference detected for '${ref1}' (got ${resRef1.intent})`);
  assert(resRef1.resolvedReference?.targetRank === 2, `Rank 2 resolved correctly`);

  const ref2 = 'Kan ugu jaban';
  const resRef2 = detectIntent(ref2, {
    activeTopic: 'real_estate',
    activeResultSet: [{ id: 'p1', rank: 1, price: 500 }, { id: 'p2', rank: 2, price: 300 }],
    slots: {},
    history: []
  });
  assert(resRef2.intent === 'PROPERTY_REFERENCE', `Reference detected for '${ref2}' (got ${resRef2.intent})`);
  assert(resRef2.resolvedReference?.type === 'COMPARATIVE' && resRef2.resolvedReference?.targetProperty?.id === 'p2', `Cheapest target resolved to p2`);
}

console.log('\n[CATEGORY 4] CONFIRMATION_REQUEST Context-Aware Handling');
{
  // User says "Ma hubtaa?" after assistant welcome
  const lastAssistantIntro = 'Ku soo dhowow Kiro-Maal. Waxaan kaa caawin karaa guryaha, apartments-ka, villas-ka, dhulka, kirada iyo iibka.';
  const resConf1 = detectIntent('Ma hubtaa?', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantIntro);
  assert(resConf1.intent === 'CONFIRMATION_REQUEST', `'Ma hubtaa?' classified as CONFIRMATION_REQUEST (got ${resConf1.intent})`);
  assert(resConf1.intent !== 'OUT_OF_SCOPE', `'Ma hubtaa?' is NEVER classified as OUT_OF_SCOPE`);

  const resConf2 = detectIntent('Sax miyaa?', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantIntro);
  assert(resConf2.intent === 'CONFIRMATION_REQUEST', `'Sax miyaa?' classified as CONFIRMATION_REQUEST (got ${resConf2.intent})`);

  const resConf3 = detectIntent('Are you sure?', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantIntro);
  assert(resConf3.intent === 'CONFIRMATION_REQUEST', `'Are you sure?' classified as CONFIRMATION_REQUEST (got ${resConf3.intent})`);
}

console.log('\n[CATEGORY 5] CLARIFICATION_REQUEST Context-Aware Handling');
{
  const lastAssistantMsg = 'Guryaha kirada ah ee Hodan waxay u baahan yihiin deebaaji.';
  const resClar1 = detectIntent('Maxaad ula jeeddaa?', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantMsg);
  assert(resClar1.intent === 'CLARIFICATION_REQUEST', `'Maxaad ula jeeddaa?' classified as CLARIFICATION_REQUEST (got ${resClar1.intent})`);
  assert(resClar1.intent !== 'OUT_OF_SCOPE', `'Maxaad ula jeeddaa?' is NOT OUT_OF_SCOPE`);

  const resClar2 = detectIntent('Sidee?', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantMsg);
  assert(resClar2.intent === 'CLARIFICATION_REQUEST', `'Sidee?' classified as CLARIFICATION_REQUEST (got ${resClar2.intent})`);

  const resClar3 = detectIntent('Faahfaahi', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  }, lastAssistantMsg);
  assert(resClar3.intent === 'CLARIFICATION_REQUEST', `'Faahfaahi' classified as CLARIFICATION_REQUEST (got ${resClar3.intent})`);
}

console.log('\n[CATEGORY 6] CORRECTION Slots & Intent Handling');
{
  const resCorr1 = detectIntent('500 ma aha, 400 ayaan ula jeeday', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: { budgetMax: 500 },
    history: []
  });
  assert(resCorr1.intent === 'CORRECTION', `'500 ma aha, 400' detected as CORRECTION (got ${resCorr1.intent})`);

  const resCorr2 = detectIntent('Hodan ma aha, Wadajir', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: { district: 'Hodan' },
    history: []
  });
  assert(resCorr2.intent === 'CORRECTION', `'Hodan ma aha, Wadajir' detected as CORRECTION (got ${resCorr2.intent})`);

  const resCorr3 = detectIntent('3 qol ma aha, 4 qol', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: { bedrooms: 3 },
    history: []
  });
  assert(resCorr3.intent === 'CORRECTION', `'3 qol ma aha, 4 qol' detected as CORRECTION (got ${resCorr3.intent})`);

  // Verify state updating preserves existing slots while applying correction
  let testState = initializeConversationState('corr-test');
  testState.slots = {
    city: 'Mogadishu',
    district: 'Hodan',
    maxPrice: 500,
    bedrooms: 3,
    propertyType: 'APARTMENT',
    purpose: 'RENT'
  };

  const updated1 = applyStateUpdate(testState, 'Hodan ma aha, Wadajir');
  assert(updated1.slots.district === 'Wadajir', `District corrected to Wadajir (got ${updated1.slots.district})`);
  assert(updated1.slots.city === 'Mogadishu', `City preserved as Mogadishu`);
  assert(updated1.slots.maxPrice === 500, `Budget preserved as 500`);
  assert(updated1.slots.bedrooms === 3, `Bedrooms preserved as 3`);

  const updated2 = applyStateUpdate(updated1, '500 ma aha, 400 ayaan ula jeeday');
  assert(updated2.slots.maxPrice === 400, `Budget corrected to 400 (got ${updated2.slots.maxPrice})`);
  assert(updated2.slots.district === 'Wadajir', `District preserved as Wadajir`);

  const updated3 = applyStateUpdate(updated2, '3 qol ma aha, 4 qol');
  assert(updated3.slots.bedrooms === 4, `Bedrooms corrected to 4 (got ${updated3.slots.bedrooms})`);
  assert(updated3.slots.maxPrice === 400, `Budget preserved as 400`);
}

console.log('\n[CATEGORY 7] REQUIREMENT_UPDATE Handling');
{
  const resReq1 = detectIntent('Parking-na waa muhiim', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: { city: 'Mogadishu', bedrooms: 3 },
    history: []
  });
  assert(resReq1.intent === 'REQUIREMENT_UPDATE', `'Parking-na waa muhiim' classified as REQUIREMENT_UPDATE (got ${resReq1.intent})`);

  const resReq2 = detectIntent('Budget-ka $600 ka dhig', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: { city: 'Mogadishu', maxPrice: 400 },
    history: []
  });
  assert(resReq2.intent === 'REQUIREMENT_UPDATE', `'Budget-ka $600 ka dhig' classified as REQUIREMENT_UPDATE (got ${resReq2.intent})`);

  let reqState = initializeConversationState('req-test');
  reqState.slots = { city: 'Mogadishu', bedrooms: 3, maxPrice: 400 };

  const stateAfter = applyStateUpdate(reqState, 'Budget-ka $600 ka dhig');
  assert(stateAfter.slots.maxPrice === 600, `Budget updated to 600 (got ${stateAfter.slots.maxPrice})`);
  assert(stateAfter.slots.bedrooms === 3, `Bedrooms preserved as 3`);

  const stateAfterParking = applyStateUpdate(stateAfter, 'Parking-na waa muhiim');
  assert(stateAfterParking.slots.parking === true, `Parking flag added`);
  assert(stateAfterParking.slots.maxPrice === 600, `Budget preserved as 600`);
  assert(stateAfterParking.slots.city === 'Mogadishu', `City preserved as Mogadishu`);
}

console.log('\n[CATEGORY 8] CASUAL_CONVERSATION Handling');
{
  const resCas1 = detectIntent('Asc', { activeTopic: 'casual', activeResultSet: [], slots: {}, history: [] });
  assert(resCas1.intent === 'CASUAL_CONVERSATION', `'Asc' classified as CASUAL_CONVERSATION`);

  const resCas2 = detectIntent('Sidee tahay?', { activeTopic: 'casual', activeResultSet: [], slots: {}, history: [] });
  assert(resCas2.intent === 'CASUAL_CONVERSATION', `'Sidee tahay?' classified as CASUAL_CONVERSATION`);

  const resCas3 = detectIntent('Mahadsanid', { activeTopic: 'casual', activeResultSet: [], slots: {}, history: [] });
  assert(resCas3.intent === 'CASUAL_CONVERSATION', `'Mahadsanid' classified as CASUAL_CONVERSATION`);

  const resCas4 = detectIntent('Ok', { activeTopic: 'casual', activeResultSet: [], slots: {}, history: [] });
  assert(resCas4.intent === 'CASUAL_CONVERSATION', `'Ok' classified as CASUAL_CONVERSATION`);
}

console.log('\n[CATEGORY 9] OUT_OF_SCOPE Direct Handling');
{
  const resOos1 = detectIntent('Casharrada school-ka iga caawi.', { activeTopic: 'real_estate', activeResultSet: [], slots: {}, history: [] });
  assert(resOos1.intent === 'OUT_OF_SCOPE', `'Casharrada school-ka iga caawi' classified as OUT_OF_SCOPE (got ${resOos1.intent})`);

  const resOos2 = detectIntent('Bitcoin maanta meeqa ayuu yahay?', { activeTopic: 'real_estate', activeResultSet: [], slots: {}, history: [] });
  assert(resOos2.intent === 'OUT_OF_SCOPE', `'Bitcoin...' classified as OUT_OF_SCOPE`);

  const resOos3 = detectIntent('Sidee loo sameeyaa website?', { activeTopic: 'real_estate', activeResultSet: [], slots: {}, history: [] });
  assert(resOos3.intent === 'OUT_OF_SCOPE', `'Sidee loo sameeyaa website?' classified as OUT_OF_SCOPE`);

  const resOos4 = detectIntent('Yaa madaxweyne ka ah dalka?', { activeTopic: 'real_estate', activeResultSet: [], slots: {}, history: [] });
  assert(resOos4.intent === 'OUT_OF_SCOPE', `'Yaa madaxweyne...' classified as OUT_OF_SCOPE`);
}

console.log('\n[CATEGORY 10] AMBIGUOUS Handling');
{
  // User says "Kan ii samee" with NO active property or active reference
  const resAmb = detectIntent('Kan ii samee', {
    activeTopic: 'real_estate',
    activeResultSet: [],
    slots: {},
    history: []
  });
  assert(resAmb.intent === 'AMBIGUOUS', `'Kan ii samee' without reference classified as AMBIGUOUS (got ${resAmb.intent})`);
}

// ---------------------------------------------------------------------------
// 2. End-to-End Dialogues & Conversational Context Inferences
// ---------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(' END-TO-END MULTI-TURN CONTEXT DIALOGUES');
console.log('======================================================================\n');

async function runE2ETests() {
  // Helper to run conversation sessions
  function createSession(sessionId) {
    const history = [];
    return async function send(msg) {
      const res = await processConversationalTurn({
        sessionId,
        message: msg,
        history: [...history]
      });
      history.push({ role: 'user', content: msg });
      history.push({
        role: 'assistant',
        content: res.reply,
        metadata: JSON.stringify({ conversationState: res.state })
      });
      return res;
    };
  }

  // SCENARIO 1: Confirmation Request after Assistant Intro
  console.log('--- Dialogue 1: Assistant Greeting -> User: "Ma hubtaa midaas?" ---');
  const session1 = createSession('session-1-confirm');
  
  // Turn 1: User says greeting
  const t1 = await session1('Asc');
  assert(t1.responseType === 'GREETING', `Turn 1 responseType is GREETING`);

  // Turn 2: User asks "Ma hubtaa midaas?"
  const t2 = await session1('Ma hubtaa midaas?');
  assert(t2.responseType === 'CONFIRMATION', `Turn 2 responseType is CONFIRMATION (got ${t2.responseType})`);
  assert(t2.reply.includes('Kiro-Maal') && (t2.reply.includes('Haa') || t2.reply.includes('dhab')), `Turn 2 confirms AIDA scope: "${t2.reply.slice(0, 70)}..."`);
  assert(!t2.reply.includes('Magaaladee') && !t2.reply.includes('Budget-kaagu'), `Turn 2 does NOT force search questionnaire`);
  assert(t2.properties.length === 0, `Turn 2 suppresses property cards`);

  // SCENARIO 2: Clarification Request
  console.log('\n--- Dialogue 2: User: "Maxaad ula jeeddaa?" ---');
  const t3 = await session1('Maxaad ula jeeddaa?');
  assert(t3.responseType === 'CLARIFICATION', `Turn 3 responseType is CLARIFICATION (got ${t3.responseType})`);
  assert(!t3.reply.includes('Magaaladee') && !t3.reply.includes('Budget-kaagu'), `Turn 3 does NOT ask real estate questionnaire questions`);
  assert(t3.properties.length === 0, `Turn 3 suppresses property cards`);

  // SCENARIO 3: Complete Requirement Statement -> Do Not Repeat Questions
  console.log('\n--- Dialogue 3: User: "Waxaan rabaa 3-bedroom apartment oo Hodan ah, $400." ---');
  const session2 = createSession('session-2-reqs');
  const t4 = await session2('Waxaan rabaa 3-bedroom apartment oo Hodan ah, $400.');
  assert(t4.state.slots.bedrooms === 3, `State captured bedrooms = 3`);
  assert(t4.state.slots.propertyType?.toUpperCase() === 'APARTMENT', `State captured propertyType = apartment`);
  assert(t4.state.slots.district === 'Hodan', `State captured district = Hodan`);
  assert(t4.state.slots.maxPrice === 400, `State captured budget = 400`);
  assert(!t4.reply.includes('Xaafaddee') && !t4.reply.includes('meeqa qol'), `Turn 4 does NOT repeat asking for bedrooms or district`);

  // SCENARIO 4: Requirement Update -> "Parking-na waa muhiim"
  console.log('\n--- Dialogue 4: User adds requirement: "Parking-na waa muhiim" ---');
  const t5 = await session2('Parking-na waa muhiim');
  assert(t5.state.slots.parking === true, `State updated parking = true`);
  assert(t5.state.slots.bedrooms === 3, `State retained bedrooms = 3`);
  assert(t5.state.slots.district === 'Hodan', `State retained district = Hodan`);
  assert(t5.state.slots.maxPrice === 400, `State retained budget = 400`);

  // SCENARIO 5: Correction -> "Hodan ma aha, Wadajir"
  console.log('\n--- Dialogue 5: User corrects: "Hodan ma aha, Wadajir" ---');
  const t6 = await session2('Hodan ma aha, Wadajir');
  assert(t6.responseType === 'CORRECTION', `Turn 6 responseType is CORRECTION (got ${t6.responseType})`);
  assert(t6.state.slots.district === 'Wadajir', `District changed from Hodan to Wadajir (got ${t6.state.slots.district})`);
  assert(t6.state.slots.bedrooms === 3, `Bedrooms retained as 3`);
  assert(t6.state.slots.maxPrice === 400, `Budget retained as 400`);
  assert(t6.reply.includes('Wadajir'), `Assistant explicitly acknowledged correction to Wadajir`);

  // SCENARIO 6: Ambiguous Reference without Prior Context
  console.log('\n--- Dialogue 6: User says "Kan ii samee" with empty context ---');
  const session3 = createSession('session-3-ambig');
  const t7 = await session3('Kan ii samee');
  assert(t7.responseType === 'AMBIGUOUS', `Turn 7 responseType is AMBIGUOUS (got ${t7.responseType})`);
  assert(t7.reply.includes('Maxaad ula jeeddaa kan') || t7.reply.includes('property-ga'), `Turn 7 asks clarification on reference`);

  console.log('\n======================================================================');
  console.log(` FINAL TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
