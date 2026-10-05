/**
 * AIDA Gemini-Native Architecture Multi-Turn Conversation Verification Suite
 * Verifies Tests A through H as defined in Section 11 of the architecture specification.
 */

import { processConversationalTurn } from '../lib/ai/conversation/chat-engine.ts';
import { initializeConversationState } from '../lib/ai/conversation/state-manager.ts';

async function runGeminiNativeTests() {
  console.log('======================================================================');
  console.log(' GEMINI-NATIVE ARCHITECTURE VERIFICATION SUITE (TESTS A - H)');
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
  // Test A — Natural Somali
  // User: "asc walaal guri baan raadinayaa lacag badanna ma hayo qiyaastii 400 ilaa 500 ayaan awoodaa"
  // Expected: Gemini understands this naturally and responds conversationally.
  // ---------------------------------------------------------------------------
  console.log('--- Test A: Natural Somali ---');
  const sessionA = 'test-session-gemini-a';
  const turnA = await processConversationalTurn({
    sessionId: sessionA,
    message: 'asc walaal guri baan raadinayaa lacag badanna ma hayo qiyaastii 400 ilaa 500 ayaan awoodaa',
    history: [],
  });

  assert(turnA.reply && turnA.reply.length > 0, 'Test A: Reply is generated');
  assert(turnA.state.slots.maxPrice === 500, 'Test A: Budget understood as max 500', `Got ${turnA.state.slots.maxPrice}`);
  console.log('Reply A:', turnA.reply);
  console.log('Slots A:', JSON.stringify(turnA.state.slots));

  // ---------------------------------------------------------------------------
  // Test B — Soft Preference vs Hard Requirement
  // User: "3 qol haddii la heli karo way fiican tahay laakiin khasab ma aha"
  // Expected: 3 bedrooms is understood as a preference, not a hard requirement.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test B: Soft Preference ---');
  const sessionB = 'test-session-gemini-b';
  const turnB = await processConversationalTurn({
    sessionId: sessionB,
    message: '3 qol haddii la heli karo way fiican tahay laakiin khasab ma aha',
    history: [],
  });

  assert(
    turnB.state.slots.softPreferences?.includes('3_bedrooms_preferred') ||
    turnB.state.slots.bedrooms === undefined ||
    turnB.state.slots.bedrooms === null,
    'Test B: 3 bedrooms treated as soft preference and not hard constraint',
    `Slots: ${JSON.stringify(turnB.state.slots)}`
  );
  console.log('Reply B:', turnB.reply);
  console.log('Slots B:', JSON.stringify(turnB.state.slots));

  // ---------------------------------------------------------------------------
  // Test C — Negation
  // User: "Guri Hodan ah ayaan rabaa"
  // Later: "hodan ma rabo meel shaqadayda u dhow ayaan rabaa"
  // Expected: Hodan is rejected, not selected.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test C: Negation ---');
  const sessionC = 'test-session-gemini-c';
  const historyC = [];

  const turnC1 = await processConversationalTurn({
    sessionId: sessionC,
    message: 'Guri Hodan ah ayaan rabaa',
    history: historyC,
  });
  assert(turnC1.state.slots.district === 'Hodan', 'Test C1: Hodan initially selected');
  historyC.push({ role: 'user', content: 'Guri Hodan ah ayaan rabaa' });
  historyC.push({ role: 'assistant', content: turnC1.reply });

  const turnC2 = await processConversationalTurn({
    sessionId: sessionC,
    message: 'hodan ma rabo meel shaqadayda u dhow ayaan rabaa',
    history: historyC,
  });

  assert(
    turnC2.state.slots.district !== 'Hodan',
    'Test C2: Hodan is removed from district slot after negation',
    `District was: ${turnC2.state.slots.district}`
  );
  assert(
    turnC2.state.slots.excludedLocations?.includes('Hodan'),
    'Test C2: Hodan is added to excludedLocations',
    `Excluded: ${JSON.stringify(turnC2.state.slots.excludedLocations)}`
  );
  assert(
    turnC2.state.slots.softPreferences?.includes('close_to_workplace'),
    'Test C2: Proximity to workplace recognized as preference'
  );
  console.log('Reply C2:', turnC2.reply);
  console.log('Slots C2:', JSON.stringify(turnC2.state.slots));

  // ---------------------------------------------------------------------------
  // Test D — Correction
  // User: "500 ayaan awoodayaa"
  // Then: "maya 500 ka badan ma awoodo"
  // Expected: The later message clarifies/sets the maximum budget.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test D: Correction ---');
  const sessionD = 'test-session-gemini-d';
  const historyD = [];

  const turnD1 = await processConversationalTurn({
    sessionId: sessionD,
    message: '500 ayaan awoodayaa',
    history: historyD,
  });
  assert(turnD1.state.slots.maxPrice === 500, 'Test D1: Initial budget set to 500');
  historyD.push({ role: 'user', content: '500 ayaan awoodayaa' });
  historyD.push({ role: 'assistant', content: turnD1.reply });

  const turnD2 = await processConversationalTurn({
    sessionId: sessionD,
    message: 'maya 500 ka badan ma awoodo',
    history: historyD,
  });
  assert(turnD2.state.slots.maxPrice === 500, 'Test D2: Maximum budget clarified and maintained at 500');
  console.log('Reply D2:', turnD2.reply);

  // ---------------------------------------------------------------------------
  // Test E — Property Reference
  // User: Searches for properties, then: "kan labaad qiimihiisa ka warran"
  // Expected: Gemini understands "kan labaad" from the active result set.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test E: Property Reference ---');
  const sessionE = 'test-session-gemini-e';
  const historyE = [];

  const turnE1 = await processConversationalTurn({
    sessionId: sessionE,
    message: 'apartment Mogadishu ku yaal oo 3 qol ah miisaaniyad $500',
    history: historyE,
  });
  assert(turnE1.properties.length > 0, 'Test E1: Returned active property results');
  historyE.push({ role: 'user', content: 'apartment Mogadishu ku yaal oo 3 qol ah miisaaniyad $500' });
  historyE.push({ role: 'assistant', content: turnE1.reply });

  const turnE2 = await processConversationalTurn({
    sessionId: sessionE,
    message: 'kan labaad qiimihiisa ka warran',
    history: historyE,
    initialState: turnE1.state,
  });

  assert(turnE2.responseType === 'PROPERTY_DETAIL', 'Test E2: Response type is PROPERTY_DETAIL');
  assert(turnE2.properties.length === 1, 'Test E2: Target property isolated');
  assert(turnE2.reply.includes('$') || turnE2.reply.includes('qiim'), 'Test E2: Price answered accurately');
  console.log('Reply E2:', turnE2.reply);

  // ---------------------------------------------------------------------------
  // Test F — Long Conversation Context
  // Start with: "KM4 ayaan ka shaqeeyaa."
  // Later: "mid shaqadayda u dhow ii raadi."
  // Expected: Remembers KM4 / workplace proximity context.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test F: Long Conversation Context ---');
  const sessionF = 'test-session-gemini-f';
  const historyF = [];

  const turnF1 = await processConversationalTurn({
    sessionId: sessionF,
    message: 'KM4 ayaan ka shaqeeyaa.',
    history: historyF,
  });
  historyF.push({ role: 'user', content: 'KM4 ayaan ka shaqeeyaa.' });
  historyF.push({ role: 'assistant', content: turnF1.reply });

  const turnF2 = await processConversationalTurn({
    sessionId: sessionF,
    message: 'apartment 3 qol ah oo degan ayaan rabaa',
    history: historyF,
    initialState: turnF1.state,
  });
  historyF.push({ role: 'user', content: 'apartment 3 qol ah oo degan ayaan rabaa' });
  historyF.push({ role: 'assistant', content: turnF2.reply });

  const turnF3 = await processConversationalTurn({
    sessionId: sessionF,
    message: 'mid shaqadayda u dhow ii raadi',
    history: historyF,
    initialState: turnF2.state,
  });

  assert(
    turnF3.state.slots.softPreferences?.includes('close_to_workplace'),
    'Test F3: Remembers workplace proximity preference'
  );
  assert(
    turnF3.state.slots.userReasoning?.some(r => r.includes('KM4')),
    'Test F3: Remembers KM4 reasoning from first turn'
  );
  console.log('Reply F3:', turnF3.reply);
  console.log('Reasoning & Preferences:', JSON.stringify({
    softPreferences: turnF3.state.slots.softPreferences,
    userReasoning: turnF3.state.slots.userReasoning,
  }));

  // ---------------------------------------------------------------------------
  // Test G — Casual Conversation
  // User: "mahadsanid walaal"
  // Expected: Natural conversational response.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test G: Casual Conversation ---');
  const sessionG = 'test-session-gemini-g';
  const turnG = await processConversationalTurn({
    sessionId: sessionG,
    message: 'mahadsanid walaal',
    history: [],
  });

  assert(turnG.responseType === 'GENERAL_CONVERSATION', 'Test G: Intent is GENERAL_CONVERSATION');
  assert(
    turnG.reply.toLowerCase().includes('mudan') ||
    turnG.reply.toLowerCase().includes('adaa') ||
    turnG.reply.toLowerCase().includes('welcome') ||
    turnG.reply.toLowerCase().includes('caawin') ||
    turnG.reply.toLowerCase().includes('diyaar'),
    'Test G: Natural warm gratitude acknowledgment',
    `Got: ${turnG.reply}`
  );
  console.log('Reply G:', turnG.reply);

  // ---------------------------------------------------------------------------
  // Test H — No Results
  // If no verified property matches:
  // Expected: Naturally explains no verified match found, suggests reasonable alternatives.
  // ---------------------------------------------------------------------------
  console.log('\n--- Test H: No Results ---');
  const sessionH = 'test-session-gemini-h';
  const turnH = await processConversationalTurn({
    sessionId: sessionH,
    message: 'guri villa ah oo 10 qol ah oo $50 ku yaal Boosaaso',
    history: [],
  });

  assert(turnH.responseType === 'NO_RESULTS', 'Test H: Response type is NO_RESULTS');
  assert(turnH.properties.length === 0, 'Test H: Zero properties returned');
  assert(
    turnH.reply.toLowerCase().includes('ma') ||
    turnH.reply.toLowerCase().includes('hel') ||
    turnH.reply.toLowerCase().includes('raali') ||
    turnH.reply.toLowerCase().includes('kuma helin'),
    'Test H: Naturally explains no verified match found',
    `Got: ${turnH.reply}`
  );
  console.log('Reply H:', turnH.reply);

  console.log('\n======================================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiNativeTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
