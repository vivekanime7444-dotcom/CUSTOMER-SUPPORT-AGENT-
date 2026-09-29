/**
 * NOVA MART — Order Resolution & Context Regression Test Suite
 * 
 * Verifies:
 * TEST 1: Customer has one order -> "where is my order" resolves it.
 * TEST 2: Customer has multiple orders -> agent asks which order.
 * TEST 3: Customer has no orders -> safe response.
 * TEST 4: Exact valid order ID NM-8472 works.
 * TEST 5: Malformed ID IDNM-8472 does not cause incorrect lookup.
 * TEST 6: Frontend display "#NM-8472" does not alter canonical ID.
 * TEST 7: "i want refund" resolves the customer's applicable order.
 * TEST 8: Refund request uses the protected action workflow.
 * TEST 9: Unauthorized customer cannot access another customer's order.
 * TEST 10: Unauthorized tracking access is denied.
 * TEST 11: Current authoritative order status overrides Hindsight.
 * TEST 12: Hindsight remains functional for unrelated conversational memory.
 */

require('dotenv').config();

const { generateChatResponse } = require('./src/services/aiService');
const { executeTool, normalizeOrderId } = require('./src/services/toolsService');
const { retainMemory, recallMemory, extractMemoryStrings } = require('./src/services/hindsightService');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const logPass = (title) => console.log(`${GREEN}[PASS]${RESET} ${title}`);
const logFail = (title, err) => console.log(`${RED}[FAIL]${RESET} ${title} -> ${err}`);
const logInfo = (msg) => console.log(`${YELLOW}ℹ [TEST]:${RESET} ${msg}`);

async function pause(ms = 3500) {
  await new Promise(r => setTimeout(r, ms));
}

async function runOrderResolutionTests() {
  console.log('\n==================================================');
  console.log('  NOVA MART — ORDER RESOLUTION & CONTEXT TEST SUITE');
  console.log('==================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const testCust1 = 'CUST-1';
  const testCust2 = 'CUST-2';

  const order8472 = {
    orderId: 'NM-8472',
    customerId: testCust1,
    customerName: 'Test Customer',
    items: [{ productId: 'p2', productName: 'NovaBook Pro 15', quantity: 1, unitPrice: 1499.00 }],
    totalAmount: 1499.00,
    status: 'SHIPPED',
    shipping: { carrier: 'FedEx', trackingNumber: 'FX-84729102', shippedAt: '2026-09-27' },
    delivery: { estimatedDate: '2026-09-30' },
    trackingEvents: [
      { date: '2026-09-26', event: 'Order placed' },
      { date: '2026-09-27', event: 'Shipped via FedEx (FX-84729102)' }
    ]
  };

  const orderDelivered = {
    orderId: 'NM-5501',
    customerId: testCust1,
    customerName: 'Test Customer',
    items: [{ productId: 'p1', productName: 'NovaPhone X', quantity: 1, unitPrice: 899.99 }],
    totalAmount: 899.99,
    status: 'DELIVERED',
    shipping: { carrier: 'UPS', trackingNumber: 'UPS-5501' },
    delivery: { deliveredAt: '2026-09-25' },
    return: { requested: false, status: null }
  };

  const multiOrdersCust = [
    order8472,
    {
      orderId: 'NM-9901',
      customerId: testCust1,
      totalAmount: 199.50,
      status: 'PROCESSING'
    }
  ];

  // --- TEST 1: Customer has one order -> "where is my order" resolves it ---
  try {
    logInfo('Test 1: Single order customer asking "where is my order"...');
    const reply = await generateChatResponse('where is my order', [], testCust1, [order8472]);
    console.log(`\nReply:\n${reply}\n`);

    const mentions8472 = reply.includes('NM-8472') || reply.includes('8472');
    const mentionsFedexOrShipped = reply.toLowerCase().includes('shipped') || reply.includes('FX-84729102') || reply.toLowerCase().includes('fedex');

    if (mentions8472 && mentionsFedexOrShipped) {
      logPass('Customer has one order -> "where is my order" resolves it.');
      totalPassed++;
    } else {
      logFail('Single order resolution failed', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 1 error', err.message);
    totalFailed++;
  }

  // --- TEST 2: Customer has multiple orders -> agent asks which order ---
  try {
    await pause();
    logInfo('Test 2: Multiple order customer asking "where is my order"...');
    const reply = await generateChatResponse('where is my order', [], testCust1, multiOrdersCust);
    console.log(`\nReply:\n${reply}\n`);

    const asksWhichOrder = (reply.includes('NM-8472') && reply.includes('NM-9901')) ||
                           reply.toLowerCase().includes('which order') ||
                           reply.toLowerCase().includes('multiple orders');

    if (asksWhichOrder) {
      logPass('Customer has multiple orders -> agent asks which order.');
      totalPassed++;
    } else {
      logFail('Multiple order disambiguation failed', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 2 error', err.message);
    totalFailed++;
  }

  // --- TEST 3: Customer has no orders -> safe response ---
  try {
    await pause();
    logInfo('Test 3: Customer with 0 orders asking "where is my order"...');
    const reply = await generateChatResponse('where is my order', [], testCust2, []);
    console.log(`\nReply:\n${reply}\n`);

    const noOrdersFound = reply.toLowerCase().includes('no') && 
                         (reply.toLowerCase().includes('order') || reply.toLowerCase().includes('found') || reply.toLowerCase().includes('active'));

    if (noOrdersFound && !reply.includes('NM-')) {
      logPass('Customer has no orders -> safe response without fabricating IDs.');
      totalPassed++;
    } else {
      logFail('Zero order response failed', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 3 error', err.message);
    totalFailed++;
  }

  // --- TEST 4: Exact valid order ID NM-8472 works ---
  try {
    await pause();
    logInfo('Test 4: Customer asking specifically for "what is the status of NM-8472"...');
    const reply = await generateChatResponse('what is the status of NM-8472', [], testCust1, [order8472]);
    console.log(`\nReply:\n${reply}\n`);

    const reportsStatus = (reply.includes('NM-8472') || reply.includes('8472')) &&
                          (reply.toLowerCase().includes('shipped') || reply.includes('FX-84729102'));

    if (reportsStatus) {
      logPass('Exact valid order ID NM-8472 works.');
      totalPassed++;
    } else {
      logFail('Exact order ID lookup failed', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 4 error', err.message);
    totalFailed++;
  }

  // --- TEST 5: Malformed ID IDNM-8472 does not cause incorrect lookup ---
  try {
    await pause(1000);
    logInfo('Test 5: Malformed ID "IDNM-8472" tool execution...');
    const toolRes = await executeTool('get_order_status', { orderId: 'IDNM-8472' }, testCust1, [order8472]);
    
    if (toolRes.error && (toolRes.error.includes('not found') || toolRes.error.includes('access denied'))) {
      logPass('Malformed ID IDNM-8472 does not cause incorrect lookup.');
      totalPassed++;
    } else {
      logFail('Malformed ID check failed', JSON.stringify(toolRes));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 5 error', err.message);
    totalFailed++;
  }

  // --- TEST 6: Frontend display "#NM-8472" does not alter canonical ID ---
  try {
    logInfo('Test 6: Normalizing "#NM-8472"...');
    const normalized = normalizeOrderId('#NM-8472');
    const toolRes = await executeTool('get_order_status', { orderId: '#NM-8472' }, testCust1, [order8472]);

    if (normalized === 'NM-8472' && toolRes.orderId === 'NM-8472') {
      logPass('Frontend display "#NM-8472" safely normalizes to canonical "NM-8472".');
      totalPassed++;
    } else {
      logFail('Display # normalization failed', `${normalized} / ${JSON.stringify(toolRes)}`);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 6 error', err.message);
    totalFailed++;
  }

  // --- TEST 7: "i want refund" resolves the customer's applicable order ---
  try {
    await pause();
    logInfo('Test 7: Customer with single delivered order saying "i want refund"...');
    const reply = await generateChatResponse('i want refund', [], testCust1, [orderDelivered]);
    console.log(`\nReply:\n${reply}\n`);

    const handlesRefund = reply.toLowerCase().includes('refund') || reply.toLowerCase().includes('return') || reply.includes('NM-5501');

    if (handlesRefund) {
      logPass('"i want refund" resolves the customer\'s applicable order.');
      totalPassed++;
    } else {
      logFail('Refund resolution failed', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 7 error', err.message);
    totalFailed++;
  }

  // --- TEST 8: Refund request uses the protected action workflow ---
  try {
    await pause(1000);
    logInfo('Test 8: Protected refund/return request workflow on delivered order...');
    const actionRes = await executeTool('request_return', { 
      orderId: 'NM-5501', 
      resolution: 'REFUND', 
      reason: 'Defective screen' 
    }, testCust1, [orderDelivered]);

    if (actionRes.success === true && actionRes.returnStatus && actionRes.returnStatus.status === 'PENDING_ADMIN_REVIEW') {
      logPass('Refund request uses the protected action workflow (PENDING_ADMIN_REVIEW).');
      totalPassed++;
    } else {
      logFail('Protected return workflow check failed', JSON.stringify(actionRes));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 8 error', err.message);
    totalFailed++;
  }

  // --- TEST 9: Unauthorized customer cannot access another customer's order ---
  try {
    await pause(1000);
    logInfo('Test 9: Customer 2 attempting access to Customer 1 order NM-8472...');
    const unauthRes = await executeTool('get_order_details', { orderId: 'NM-8472' }, testCust2, [order8472]);

    if (unauthRes.error && unauthRes.error.includes('access denied')) {
      logPass('Unauthorized customer cannot access another customer\'s order.');
      totalPassed++;
    } else {
      logFail('Cross-customer order isolation failed', JSON.stringify(unauthRes));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 9 error', err.message);
    totalFailed++;
  }

  // --- TEST 10: Unauthorized tracking access is denied ---
  try {
    await pause(1000);
    logInfo('Test 10: Customer 2 requesting tracking for Customer 1 order...');
    const unauthTrack = await executeTool('get_tracking', { orderId: 'NM-8472' }, testCust2, [order8472]);

    if (unauthTrack.error && unauthTrack.error.includes('access denied')) {
      logPass('Unauthorized tracking access is denied.');
      totalPassed++;
    } else {
      logFail('Cross-customer tracking access leak', JSON.stringify(unauthTrack));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 10 error', err.message);
    totalFailed++;
  }

  // --- TEST 11: Current authoritative order status overrides Hindsight ---
  try {
    await pause();
    logInfo('Test 11: Authoritative business order status overrides Hindsight memory...');
    await retainMemory(testCust1, 'Customer note: Order NM-8472 is being packed.');
    await pause(2000);

    const reply = await generateChatResponse('What is the status of NM-8472?', [], testCust1, [order8472]);
    console.log(`\nReply:\n${reply}\n`);

    const reportsShipped = reply.toLowerCase().includes('shipped') || reply.includes('FX-84729102');

    if (reportsShipped) {
      logPass('Current authoritative order status overrides Hindsight.');
      totalPassed++;
    } else {
      logFail('Authoritative status did not override memory', reply);
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 11 error', err.message);
    totalFailed++;
  }

  // --- TEST 12: Hindsight remains functional for unrelated conversational memory ---
  try {
    await pause();
    logInfo('Test 12: Hindsight retains conversational preference...');
    await retainMemory(testCust1, 'Customer preference: Prefers email notifications over phone calls.');
    await pause(2000);

    const memories = extractMemoryStrings(await recallMemory(testCust1, 'contact notification preference'));
    const hasPref = memories.some(m => m.toLowerCase().includes('email') || m.toLowerCase().includes('preference'));

    if (hasPref) {
      logPass('Hindsight remains functional for unrelated conversational memory.');
      totalPassed++;
    } else {
      logFail('Conversational memory check failed', JSON.stringify(memories));
      totalFailed++;
    }
  } catch (err) {
    logFail('Test 12 error', err.message);
    totalFailed++;
  }

  // --- RESULTS SUMMARY ---
  console.log('\n==================================================');
  console.log(`  RESULTS: ${totalPassed}/12 PASSED, ${totalFailed} FAILED`);
  console.log('==================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runOrderResolutionTests();
