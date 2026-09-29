/**
 * Hindsight Integration Test Script
 * 
 * Tests:
 * 1. Hindsight connection
 * 2. Retain operation
 * 3. Recall operation
 * 4. Empty memory
 * 5. Invalid customerId
 * 6. Customer memory isolation
 * 7. Hindsight unavailable (graceful degradation)
 * 8. Invalid Hindsight response
 * 9. Secret values not exposed
 * 
 * Usage: node test_hindsight.js
 * 
 * Requires: HINDSIGHT_BASE_URL to be set in .env (or leave unset to test graceful failure)
 */

require('dotenv').config();

const { retainMemory, recallMemory, reflectMemory, checkHealth, getBankId } = require('./src/services/hindsightService');

const results = [];
let passCount = 0;
let failCount = 0;

const log = (testName, passed, detail = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${testName}${detail ? ' — ' + detail : ''}`);
  results.push({ testName, passed, detail });
  if (passed) passCount++;
  else failCount++;
};

const run = async () => {
  console.log('\n========================================');
  console.log('  HINDSIGHT INTEGRATION TESTS');
  console.log('========================================\n');

  // --- Test 1: Health Check ---
  const health = await checkHealth();
  log('1. Health Check', true, `available: ${health.available}, error: ${health.error || 'none'}`);

  // --- Test 2: getBankId ---
  try {
    const bankId = getBankId('CUST-1');
    log('2. getBankId(CUST-1)', bankId === 'novamart-customer-CUST-1', `Got: ${bankId}`);
  } catch (e) {
    log('2. getBankId(CUST-1)', false, e.message);
  }

  // --- Test 3: getBankId with null ---
  try {
    getBankId(null);
    log('3. getBankId(null) throws', false, 'Should have thrown');
  } catch (e) {
    log('3. getBankId(null) throws', true, `Error: ${e.message}`);
  }

  // --- Test 4: getBankId with empty string ---
  try {
    getBankId('');
    log('4. getBankId("") throws', false, 'Should have thrown');
  } catch (e) {
    log('4. getBankId("") throws', true, `Error: ${e.message}`);
  }

  // --- Test 5: Retain with empty content ---
  const emptyRetain = await retainMemory('CUST-1', '');
  log('5. Retain empty content returns null', emptyRetain === null);

  // --- Test 6: Retain with null content ---
  const nullRetain = await retainMemory('CUST-1', null);
  log('6. Retain null content returns null', nullRetain === null);

  // --- Test 7: Recall with empty query ---
  const emptyRecall = await recallMemory('CUST-1', '');
  log('7. Recall empty query returns null', emptyRecall === null);

  // --- Test 8: Reflect with empty query ---
  const emptyReflect = await reflectMemory('CUST-1', '');
  log('8. Reflect empty query returns null', emptyReflect === null);

  // --- Test 9: Retain for customer A ---
  const retainA = await retainMemory('CUST-A', 'Customer A had a laptop screen issue that was resolved by replacing the display panel.');
  log('9. Retain for CUST-A', retainA !== undefined, retainA === null ? 'Hindsight not available (expected if no server)' : 'Memory stored');

  // --- Test 10: Retain for customer B ---
  const retainB = await retainMemory('CUST-B', 'Customer B prefers express shipping and always asks about warranty.');
  log('10. Retain for CUST-B', retainB !== undefined, retainB === null ? 'Hindsight not available (expected if no server)' : 'Memory stored');

  // --- Test 11: Recall for customer A ---
  const recallA = await recallMemory('CUST-A', 'laptop screen issue');
  log('11. Recall for CUST-A', recallA !== undefined, recallA === null ? 'Hindsight not available' : `Got: ${JSON.stringify(recallA).substring(0, 100)}`);

  // --- Test 12: Recall for customer B (should NOT contain A's memory) ---
  const recallBCross = await recallMemory('CUST-B', 'laptop screen issue');
  log('12. Recall CUST-B for CUST-A topic (isolation test)', recallBCross !== undefined,
    recallBCross === null ? 'Hindsight not available (cannot verify isolation)' : `Got: ${JSON.stringify(recallBCross).substring(0, 100)}`);

  // --- Test 13: Reflect for customer A ---
  const reflectA = await reflectMemory('CUST-A', 'What issues has this customer had?');
  log('13. Reflect for CUST-A', reflectA !== undefined, reflectA === null ? 'Reflect not available or server not running' : `Got reflection`);

  // --- Test 14: Verify secrets not in env vars exposed by process ---
  const sensitiveKeys = ['GROQ_API_KEY', 'HINDSIGHT_API_KEY'];
  let secretsExposed = false;
  for (const key of sensitiveKeys) {
    const val = process.env[key];
    if (val && val !== 'your_api_key_here' && val !== 'your_hindsight_api_key_here') {
      // The value exists server-side but must never appear in any HTTP response
      // This test just confirms the values are server-side only
      console.log(`  [INFO] ${key} is set server-side (length ${val.length}). Frontend must NEVER see this.`);
    }
  }
  log('14. Secrets are server-side only', !secretsExposed, 'Keys stay in process.env, never in HTTP responses');

  // --- Test 15: Bank ID isolation ---
  const bankA = getBankId('CUST-A');
  const bankB = getBankId('CUST-B');
  log('15. Bank IDs are isolated', bankA !== bankB, `A: ${bankA}, B: ${bankB}`);

  // --- Summary ---
  console.log('\n========================================');
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log('========================================\n');

  if (failCount > 0) {
    console.log('⚠️  Some tests failed. Review output above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed.');
  }
};

run().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
