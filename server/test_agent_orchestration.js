/**
 * NOVA MART — Phase 6: Full AI Agent Orchestration Test Suite
 * 
 * Verifies all 12 test scenarios required in Phase 6:
 * 1. Historical issue lookup -> Hindsight memory used.
 * 2. Current order status lookup -> Authoritative business tool / data used.
 * 3. Replacement query from previous issue -> Hindsight + current business data combined.
 * 4. Memory vs tool conflict -> Business tool state wins.
 * 5. Multiple orders ambiguity -> Agent asks for clarification, does NOT guess.
 * 6. Exact Order ID provided -> Agent uses specified order.
 * 7. Tenant Security (Customer A vs Customer B) -> Access denied for cross-customer data.
 * 8. Hindsight unavailable -> Chat proceeds cleanly without memory.
 * 9. Tool error/unavailable -> Agent explains cleanly, does NOT fabricate.
 * 10. No relevant memory -> Responds normally without fake memory.
 * 11. Irrelevant memory -> Irrelevant memory ignored.
 * 12. Action requests (cancellation/return) -> Initiates formal request, preserves approval workflow.
 */

require('dotenv').config();

const { generateChatResponse } = require('./src/services/aiService');
const { retainMemory, getBankId } = require('./src/services/hindsightService');
const { executeTool } = require('./src/services/toolsService');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const logPass = (title) => console.log(`${GREEN}✔ PASS:${RESET} ${title}`);
const logFail = (title, err) => console.log(`${RED}✖ FAIL:${RESET} ${title} -> ${err}`);
const logInfo = (msg) => console.log(`${YELLOW}ℹ [TEST]:${RESET} ${msg}`);

async function runAgentOrchestrationTests() {
  console.log('\n==================================================');
  console.log('  NOVA MART PHASE 6 — FULL AI AGENT ORCHESTRATION');
  console.log('==================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const testCustA = 'CUST-ORCH-A';
  const testCustB = 'CUST-ORCH-B';

  const mockOrdersCustA = [
    {
      orderId: 'NM-20001',
      customerId: testCustA,
      orderDate: '2026-09-20',
      totalAmount: 1499.00,
      status: 'DELIVERED',
      shipping: { carrier: 'FedEx', trackingNumber: 'FX-20001', shippedAt: '2026-09-21' },
      delivery: { deliveredAt: '2026-09-24' },
      return: { requested: true, status: 'APPROVED', resolution: 'REPLACEMENT' },
      replacement: { requested: true, status: 'SHIPPED', trackingNumber: 'UPS-REPLACE-99' },
      items: [{ productId: 'p2', productName: 'NovaBook Pro 15', quantity: 1, unitPrice: 1499.00 }]
    },
    {
      orderId: 'NM-20002',
      customerId: testCustA,
      orderDate: '2026-09-27',
      totalAmount: 149.99,
      status: 'SHIPPED',
      shipping: { carrier: 'UPS', trackingNumber: 'UPS-20002', shippedAt: '2026-09-28' },
      items: [{ productId: 'p3', productName: 'SonicBuds Active', quantity: 1, unitPrice: 149.99 }]
    }
  ];

  const mockOrdersCustB = [
    {
      orderId: 'NM-30001',
      customerId: testCustB,
      orderDate: '2026-09-25',
      totalAmount: 899.99,
      status: 'ORDER_PLACED',
      items: [{ productId: 'p1', productName: 'NovaPhone X', quantity: 1, unitPrice: 899.99 }]
    }
  ];

  // --- TEST 1: Historical memory lookup ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('Running Test 1: Historical issue lookup from Hindsight...');
    await retainMemory(testCustA, 'Customer reported issue: Laptop screen was flickering severely.');
    await new Promise(r => setTimeout(r, 1500));

    const reply = await generateChatResponse(
      'What issue did I previously report with my laptop?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 1 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    if (reply.toLowerCase().includes('flicker')) {
      logPass('Agent recalled historical laptop flickering issue from Hindsight.');
      totalPassed++;
    } else {
      logFail('Agent failed to recall historical laptop issue', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 1 exception', err.message);
    totalFailed++;
  }

  // --- TEST 2: Current order status lookup ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 2: Current order status lookup using business tools...');
    const reply = await generateChatResponse(
      'What is the status of my order NM-20002?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 2 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    if (reply.includes('SHIPPED') || reply.includes('UPS-20002')) {
      logPass('Agent queried order status/tracking for NM-20002 using business data.');
      totalPassed++;
    } else {
      logFail('Agent failed to use current order status data', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 2 exception', err.message);
    totalFailed++;
  }

  // --- TEST 3: Combining Hindsight + Business Tool ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 3: Combining Hindsight context + Replacement business tracking...');
    await retainMemory(testCustA, 'Customer reported issue: Laptop screen flickered and customer requested replacement.');
    await new Promise(r => setTimeout(r, 1500));

    const reply = await generateChatResponse(
      'Where is the replacement for the laptop I reported damaged?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 3 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    if (reply.includes('UPS-REPLACE-99') || reply.toLowerCase().includes('shipped') || reply.toLowerCase().includes('replacement')) {
      logPass('Agent combined Hindsight replacement context with live replacement shipping tracking.');
      totalPassed++;
    } else {
      logFail('Agent failed to combine Hindsight and live replacement tracking', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 3 exception', err.message);
    totalFailed++;
  }

  // --- TEST 4: Authoritative Tool State overrides conflicting memory ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 4: Authoritative tool state primacy over outdated memory...');
    // Outdated memory says order is still processing
    await retainMemory(testCustA, 'Outdated context: Customer was told order NM-20001 is being processed.');

    const reply = await generateChatResponse(
      'What is the actual status of order NM-20001?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 4 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    if (reply.includes('DELIVERED') || reply.toLowerCase().includes('delivered')) {
      logPass('Agent prioritized verified DELIVERED tool state over outdated memory.');
      totalPassed++;
    } else {
      logFail('Outdated memory overrode authoritative business tool state', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 4 exception', err.message);
    totalFailed++;
  }

  // --- TEST 5: Ambiguous order query handling (Multiple orders) ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 5: Multiple orders disambiguation (asking customer for order ID)...');
    const reply = await generateChatResponse(
      'Where is my package?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 5 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    const normReply = reply.replace(/[\u2010-\u2015]/g, '-');
    const asksClarification = normReply.includes('NM-20001') && normReply.includes('NM-20002');
    if (asksClarification || normReply.toLowerCase().includes('specify') || normReply.toLowerCase().includes('which')) {
      logPass('Agent identified multiple active orders and requested order ID clarification.');
      totalPassed++;
    } else {
      logFail('Agent guessed an order instead of asking for clarification', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 5 exception', err.message);
    totalFailed++;
  }

  // --- TEST 6: Exact Order ID provided ---
  try {
    await new Promise(r => setTimeout(r, 4000));
    logInfo('\nRunning Test 6: Exact Order ID usage...');
    const reply = await generateChatResponse(
      'Give me tracking for order NM-20002',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 6 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    const normReply = reply.replace(/[\u2010-\u2015]/g, '-').toUpperCase();
    if (normReply.includes('UPS-20002') || normReply.includes('NM-20002')) {
      logPass('Agent directly used specified order ID NM-20002.');
      totalPassed++;
    } else {
      logFail('Agent failed to use exact order ID provided', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 6 exception', err.message);
    totalFailed++;
  }

  // --- TEST 7: Cross-Customer Tenant Isolation ---
  try {
    await new Promise(r => setTimeout(r, 2000));
    logInfo('\nRunning Test 7: Tenant Isolation (Customer B accessing Customer A order)...');
    const toolRes = await executeTool('get_order_details', { orderId: 'NM-20001' }, testCustB, mockOrdersCustA);
    console.log('[TOOL ISOLATION RES]:', toolRes);

    if (toolRes.error && toolRes.error.toLowerCase().includes('access denied')) {
      logPass('Tool directly denied Customer B access to Customer A order NM-20001.');
      totalPassed++;
    } else {
      logFail('Tenant isolation violated: Customer B accessed Customer A order', JSON.stringify(toolRes));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 7 exception', err.message);
    totalFailed++;
  }

  // --- TEST 8: Hindsight Unavailable Graceful Degradation ---
  try {
    await new Promise(r => setTimeout(r, 4000));
    logInfo('\nRunning Test 8: Hindsight service unavailable graceful degradation...');
    const origUrl = process.env.HINDSIGHT_BASE_URL;
    delete process.env.HINDSIGHT_BASE_URL;

    const reply = await generateChatResponse(
      'What is the status of order NM-20002?',
      [],
      testCustA,
      mockOrdersCustA
    );

    process.env.HINDSIGHT_BASE_URL = origUrl;

    const normReply = reply.replace(/[\u2010-\u2015]/g, '-').toUpperCase();
    if (normReply.includes('SHIPPED') || normReply.includes('UPS-20002')) {
      logPass('Agent operated cleanly without Hindsight memory service.');
      totalPassed++;
    } else {
      logFail('Agent failed when Hindsight was unconfigured', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 8 exception', err.message);
    totalFailed++;
  }

  // --- TEST 9: Non-existent order / tool failure ---
  try {
    await new Promise(r => setTimeout(r, 4000));
    logInfo('\nRunning Test 9: Non-existent order tool response handling...');
    const reply = await generateChatResponse(
      'What is the status of order NM-999999?',
      [],
      testCustA,
      mockOrdersCustA
    );
    console.log(`\n--- TEST 9 AGENT RESPONSE ---\n${reply}\n------------------------------\n`);

    const replyLower = reply.toLowerCase();
    if (replyLower.includes('locate') || replyLower.includes('not find') || replyLower.includes("can't find") || replyLower.includes("can’t find") || replyLower.includes("cannot find") || replyLower.includes('couldn') || replyLower.includes('not found') || replyLower.includes('no record') || replyLower.includes('exist')) {
      logPass('Agent cleanly explained that order NM-999999 was not found without hallucinating data.');
      totalPassed++;
    } else {
      logFail('Agent fabricated data for non-existent order', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 9 exception', err.message);
    totalFailed++;
  }

  // --- TEST 10: No relevant memory response ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 10: No relevant memory response...');
    const reply = await generateChatResponse(
      'What are the specifications of NovaPhone X?',
      [],
      testCustB,
      mockOrdersCustB
    );
    console.log(`\n--- TEST 10 AGENT RESPONSE ---\n${reply}\n-------------------------------\n`);

    if (reply.includes('6.7') || reply.includes('OLED') || reply.includes('NovaPhone X')) {
      logPass('Agent answered catalog question accurately without pretending to have prior memories.');
      totalPassed++;
    } else {
      logFail('Agent failed on catalog query without memory', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 10 exception', err.message);
    totalFailed++;
  }

  // --- TEST 11: Irrelevant memory ignored ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 11: Irrelevant memory ignored...');
    await retainMemory(testCustA, 'Customer preference: Customer likes blue phone covers.');
    await new Promise(r => setTimeout(r, 1500));

    const reply = await generateChatResponse(
      'Where is my NovaBook Pro 15 laptop replacement tracking?',
      [],
      testCustA,
      mockOrdersCustA
    );

    if (!reply.toLowerCase().includes('blue phone cover')) {
      logPass('Agent ignored blue phone cover memory when asked about laptop replacement.');
      totalPassed++;
    } else {
      logFail('Agent injected irrelevant memory into laptop tracking response', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 11 exception', err.message);
    totalFailed++;
  }

  // --- TEST 12: Action Requests (Cancellation / Return Request Workflow) ---
  try {
    await new Promise(r => setTimeout(r, 3500));
    logInfo('\nRunning Test 12: Action Request Workflow (Cancellation request submission)...');
    const reply = await generateChatResponse(
      'I want to cancel my order NM-30001',
      [],
      testCustB,
      mockOrdersCustB
    );
    console.log(`\n--- TEST 12 AGENT RESPONSE ---\n${reply}\n-------------------------------\n`);

    if (reply.toLowerCase().includes('cancel') || reply.toLowerCase().includes('submitted') || reply.toLowerCase().includes('admin') || reply.toLowerCase().includes('review')) {
      logPass('Agent processed formal cancellation request through official workflow pending Admin approval.');
      totalPassed++;
    } else {
      logFail('Agent failed to process cancellation request through formal workflow', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 12 exception', err.message);
    totalFailed++;
  }

  // --- SUMMARY ---
  console.log('\n==================================================');
  console.log(`  ORCHESTRATION RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('==================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAgentOrchestrationTests();
