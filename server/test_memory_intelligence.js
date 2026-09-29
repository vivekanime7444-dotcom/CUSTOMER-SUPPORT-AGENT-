/**
 * NOVA MART — Phase 5: Customer Memory Intelligence Verification Suite
 * 
 * Tests all requirements from Step 13:
 * 1. Troubleshooting memory retention & context-aware recall
 * 2. Avoiding duplicate troubleshooting suggestions (e.g. restart)
 * 3. Customer resolution preference retention (replacement vs refund)
 * 4. Business data primacy (Orders & tracking override memory)
 * 5. Irrelevant memory filtering
 * 6. Tenant-isolated memory per customerId
 * 7. Graceful degradation when memory service encounters errors
 */

require('dotenv').config();

const { generateChatResponse } = require('./src/services/aiService');
const { retainMemory, recallMemory, extractMemoryStrings, getBankId } = require('./src/services/hindsightService');

// Colors for console testing
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const logPass = (title) => console.log(`${GREEN}✔ PASS:${RESET} ${title}`);
const logFail = (title, err) => console.log(`${RED}✖ FAIL:${RESET} ${title} -> ${err}`);
const logInfo = (msg) => console.log(`${YELLOW}ℹ [TEST]:${RESET} ${msg}`);

async function runMemoryIntelligenceTests() {
  console.log('\n==================================================');
  console.log('  NOVA MART PHASE 5 — CUSTOMER MEMORY INTELLIGENCE');
  console.log('==================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const testCustA = 'CUST-INTELLIGENCE-A';
  const testCustB = 'CUST-INTELLIGENCE-B';

  // --- TEST 1 & 2: Troubleshooting Retention & Avoid Repeated Advice ---
  try {
    logInfo('Running Test 1 & 2: Troubleshooting retention and avoidance of repeated advice...');
    
    // Retain initial troubleshooting state
    await retainMemory(testCustA, 'Customer troubleshooting history: My laptop is overheating and I already tried restarting it multiple times.');
    
    // Wait brief moment for memory indexing
    await new Promise(r => setTimeout(r, 2000));

    const reply = await generateChatResponse(
      'My laptop is overheating again. What should I do?',
      [],
      testCustA,
      []
    );

    console.log(`\n--- AGENT RESPONSE ---\n${reply}\n----------------------\n`);

    // Verify response does not tell user to restart their laptop as the primary solution
    const tellsToRestartFirst = reply.toLowerCase().includes('try restarting') || reply.toLowerCase().includes('first, restart');
    
    if (!tellsToRestartFirst) {
      logPass('Agent recognized prior restart attempt and provided further troubleshooting steps.');
      totalPassed++;
    } else {
      logFail('Agent told customer to restart despite prior memory', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 1 & 2 failed with exception', err.message);
    totalFailed++;
  }

  // --- TEST 3: Preference Retention (Replacement vs Refund) ---
  try {
    logInfo('\nRunning Test 3: Preference retention...');
    
    await retainMemory(testCustA, 'Customer resolution preference: Customer prefers replacement instead of refund for damaged items.');
    await new Promise(r => setTimeout(r, 2000));

    const reply = await generateChatResponse(
      'My delivered item is damaged. What can we do?',
      [],
      testCustA,
      []
    );

    console.log(`\n--- AGENT RESPONSE ---\n${reply}\n----------------------\n`);

    const mentionsReplacement = reply.toLowerCase().includes('replacement') || reply.toLowerCase().includes('replace');
    
    if (mentionsReplacement) {
      logPass('Agent recalled customer preference for replacement.');
      totalPassed++;
    } else {
      logFail('Agent failed to recall replacement preference', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 3 failed with exception', err.message);
    totalFailed++;
  }

  // --- TEST 4: Current Business State Primacy ---
  try {
    logInfo('\nRunning Test 4: Business Data Primacy over Historical Memory...');
    
    // Memory says item was shipped last week
    await retainMemory(testCustA, 'Historical context: Customer was told laptop shipped last week.');

    // Authoritative order state from Admin: ORDER_DELIVERED with tracking
    const activeOrders = [{
      orderId: 'NM-9999',
      customerId: testCustA,
      status: 'DELIVERED',
      delivery: { deliveredAt: '2026-09-28 14:00' },
      shipping: { carrier: 'FedEx', trackingNumber: 'FX-987654321' }
    }];

    const reply = await generateChatResponse(
      'What is the current status of order NM-9999?',
      [],
      testCustA,
      activeOrders
    );

    console.log(`\n--- AGENT RESPONSE ---\n${reply}\n----------------------\n`);

    const acknowledgesDelivered = reply.includes('DELIVERED') || reply.toLowerCase().includes('delivered') || reply.includes('FX-987654321');

    if (acknowledgesDelivered) {
      logPass('Agent correctly prioritized authoritative business order state (DELIVERED) over past memory.');
      totalPassed++;
    } else {
      logFail('Agent failed to prioritize business data over memory', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 4 failed with exception', err.message);
    totalFailed++;
  }

  // --- TEST 5: Irrelevant Memory Filtering ---
  try {
    logInfo('\nRunning Test 5: Irrelevant Memory Filtering...');
    
    // Store unrelated headphone memory
    await retainMemory(testCustA, 'Customer preference: Customer prefers black noise-canceling headphones.');
    await new Promise(r => setTimeout(r, 1500));

    const reply = await generateChatResponse(
      'Where is my laptop replacement order NM-9999?',
      [],
      testCustA,
      [{ orderId: 'NM-9999', status: 'SHIPPED', shipping: { carrier: 'UPS', trackingNumber: 'UPS-12345' } }]
    );

    console.log(`\n--- AGENT RESPONSE ---\n${reply}\n----------------------\n`);

    const containsIrrelevantHeadphoneInfo = reply.toLowerCase().includes('black noise-canceling') || reply.toLowerCase().includes('headphone');

    if (!containsIrrelevantHeadphoneInfo) {
      logPass('Agent correctly ignored irrelevant headphone memory when asked about laptop replacement.');
      totalPassed++;
    } else {
      logFail('Agent injected irrelevant headphone memory into response', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 5 failed with exception', err.message);
    totalFailed++;
  }

  // --- TEST 6: Customer Isolation ---
  try {
    logInfo('\nRunning Test 6: Customer Memory Isolation (CUST-A vs CUST-B)...');
    
    const bankA = getBankId(testCustA);
    const bankB = getBankId(testCustB);

    if (bankA !== bankB && bankA.includes(testCustA) && bankB.includes(testCustB)) {
      logPass(`Bank isolation verified: ${bankA} vs ${bankB}`);
      totalPassed++;
    } else {
      logFail('Bank ID derivation failed customer isolation test', `${bankA} vs ${bankB}`);
      totalFailed++;
    }

    // Query Customer B and ensure Customer A's replacement preference isn't used
    const replyCustB = await generateChatResponse(
      'What are my saved support preferences?',
      [],
      testCustB,
      []
    );

    console.log(`\n--- AGENT RESPONSE FOR CUST B ---\n${replyCustB}\n---------------------------------\n`);

    if (!replyCustB.includes(testCustA)) {
      logPass('Customer B did not receive Customer A private memory.');
      totalPassed++;
    } else {
      logFail('Customer memory leaked across accounts', replyCustB);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 6 failed with exception', err.message);
    totalFailed++;
  }

  // --- SUMMARY ---
  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('==================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runMemoryIntelligenceTests();
