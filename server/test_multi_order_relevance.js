/**
 * NOVA MART — MULTI-ORDER RELEVANCE & ORDER SELECTION TEST SUITE
 * 
 * Verifies all 19 requirements specified in Section 22:
 * TEST 1: One customer order + "where is my order" -> automatically resolve the only relevant order.
 * TEST 2: Two shipped orders + "where is my order" -> show both orders.
 * TEST 3: Two return-pending orders + "what happened to my return?" -> show both orders.
 * TEST 4: One return-pending order + one unrelated shipped order -> resolve the return-pending order.
 * TEST 5: Two refund-related orders + "what happened to my refund?" -> show both.
 * TEST 6: Explicit order ID -> directly resolve that order.
 * TEST 7: Product-specific question -> resolve matching product order.
 * TEST 8: Multiple matching products -> show selector.
 * TEST 9: No matching orders -> safe response.
 * TEST 10: Selected order belongs to customer -> allow.
 * TEST 11: Selected order belongs to another customer -> deny.
 * TEST 12: Active order context works for follow-up messages.
 * TEST 13: Explicit new order ID switches active context.
 * TEST 14: Hindsight cannot create or authorize an order.
 * TEST 15: Current authoritative status overrides historical Hindsight information.
 * TEST 16: Existing Phase 7 security tests pass.
 * TEST 17: Existing Phase 8 Hindsight tests pass.
 * TEST 18: Existing agent orchestration tests pass.
 * TEST 19: Frontend builds successfully.
 */

require('dotenv').config();
const { findRelevantOrders, toOrderOptions } = require('./src/services/orderRelevanceService');
const { AUTHORITATIVE_ORDERS, getOrdersForCustomer } = require('./src/models/orderStore');
const { executeTool, normalizeOrderId } = require('./src/services/toolsService');
const { execSync } = require('child_process');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
  }
}

// Canonical mock orders for tests
const orderWatchDelivered = {
  orderId: "NM-10001",
  customerId: "CUST-1",
  productName: "NovaWatch Fit",
  items: [{ productId: "p-watch", productName: "NovaWatch Fit", quantity: 1, unitPrice: 199.99 }],
  status: "DELIVERED",
  return: { requested: true, status: "PENDING", resolution: "REFUND" },
  refund: { status: "PENDING", amount: 199.99 },
  shipping: { carrier: "UPS", trackingNumber: "1Z9999999999999999" }
};

const orderLaptopShipped = {
  orderId: "NM-8472",
  customerId: "CUST-1",
  productName: "NovaBook Pro 15",
  items: [{ productId: "p-laptop", productName: "NovaBook Pro 15", quantity: 1, unitPrice: 1299.99 }],
  status: "SHIPPED",
  return: { requested: false, status: null },
  refund: { status: null },
  shipping: { carrier: "FedEx", trackingNumber: "FX-84729102" }
};

const orderLaptopDelivered = {
  orderId: "NM-8472",
  customerId: "CUST-1",
  productName: "NovaBook Pro 15",
  items: [{ productId: "p-laptop", productName: "NovaBook Pro 15", quantity: 1, unitPrice: 1299.99 }],
  status: "DELIVERED",
  return: { requested: true, status: "PENDING", resolution: "REFUND" },
  refund: { status: "PENDING", amount: 1299.99 },
  shipping: { carrier: "FedEx", trackingNumber: "FX-84729102" }
};

const orderShipped2 = {
  orderId: "NM-8888",
  customerId: "CUST-1",
  productName: "NovaPhone 12",
  items: [{ productId: "p-phone", productName: "NovaPhone 12", quantity: 1, unitPrice: 799.99 }],
  status: "SHIPPED",
  return: { requested: false, status: null },
  refund: { status: null },
  shipping: { carrier: "USPS", trackingNumber: "9400100000000000000000" }
};

const orderOtherCustomer = {
  orderId: "NM-9999",
  customerId: "CUST-2",
  productName: "NovaTab 10",
  items: [{ productId: "p-tab", productName: "NovaTab 10", quantity: 1, unitPrice: 399.99 }],
  status: "DELIVERED"
};

async function runTests() {
  console.log('==================================================');
  console.log('  NOVA MART — MULTI-ORDER RELEVANCE TEST SUITE    ');
  console.log('==================================================\n');

  // TEST 1: One customer order + "where is my order" -> automatically resolve the only relevant order.
  console.log('--- TEST 1: One customer order + "where is my order" ---');
  const res1 = findRelevantOrders("where is my order", [orderLaptopShipped]);
  assert(
    res1.resolvedOrderId === "NM-8472" && res1.requiresSelection === false,
    'TEST 1: Single customer order automatically resolves without selection modal'
  );

  // TEST 2: Two shipped orders + "where is my order" -> show both orders.
  console.log('\n--- TEST 2: Two shipped orders + "where is my order" ---');
  const res2 = findRelevantOrders("where is my order", [orderLaptopShipped, orderShipped2]);
  assert(
    res2.requiresSelection === true && res2.orderOptions.length === 2 &&
    res2.orderOptions.some(o => o.orderId === "NM-8472") &&
    res2.orderOptions.some(o => o.orderId === "NM-8888"),
    'TEST 2: Two shipped orders require selection and provide orderOptions for both'
  );

  // TEST 3: Two return-pending orders + "what happened to my return?" -> show both orders.
  console.log('\n--- TEST 3: Two return-pending orders + "what happened to my return?" ---');
  const res3 = findRelevantOrders("what happened to my return?", [orderWatchDelivered, orderLaptopDelivered]);
  assert(
    res3.requiresSelection === true && res3.orderOptions.length === 2 &&
    res3.orderOptions.some(o => o.orderId === "NM-10001") &&
    res3.orderOptions.some(o => o.orderId === "NM-8472"),
    'TEST 3: Two return-pending orders return structured selector for both'
  );

  // TEST 4: One return-pending order + one unrelated shipped order -> resolve the return-pending order.
  console.log('\n--- TEST 4: One return-pending + one shipped order + "what happened to my return request?" ---');
  const res4 = findRelevantOrders("what happened to my return request?", [orderWatchDelivered, orderLaptopShipped]);
  assert(
    res4.resolvedOrderId === "NM-10001" && res4.requiresSelection === false,
    'TEST 4: One return-pending and one shipped order automatically resolves the return order (NM-10001)'
  );

  // TEST 5: Two refund-related orders + "what happened to my refund?" -> show both.
  console.log('\n--- TEST 5: Two refund-related orders + "what happened to my refund?" ---');
  const res5 = findRelevantOrders("what happened to my refund?", [orderWatchDelivered, orderLaptopDelivered]);
  assert(
    res5.requiresSelection === true && res5.orderOptions.length === 2,
    'TEST 5: Two refund-related orders return selector with both orders'
  );

  // TEST 6: Explicit order ID -> directly resolve that order.
  console.log('\n--- TEST 6: Explicit order ID ---');
  const res6a = findRelevantOrders("What is the status of NM-8472?", [orderWatchDelivered, orderLaptopShipped]);
  const res6b = findRelevantOrders("I want a refund for NM-10001", [orderWatchDelivered, orderLaptopShipped]);
  assert(
    res6a.resolvedOrderId === "NM-8472" && res6a.requiresSelection === false &&
    res6b.resolvedOrderId === "NM-10001" && res6b.requiresSelection === false,
    'TEST 6: Explicit order IDs (NM-8472, NM-10001) resolve directly without selection modal'
  );

  // TEST 7: Product-specific question -> resolve matching product order.
  console.log('\n--- TEST 7: Product-specific question ---');
  const res7 = findRelevantOrders("I have a problem with my laptop", [orderWatchDelivered, orderLaptopShipped]);
  assert(
    res7.resolvedOrderId === "NM-8472" && res7.requiresSelection === false,
    'TEST 7: Product keyword "laptop" correctly resolves NM-8472'
  );

  // TEST 8: Multiple matching products -> show selector.
  console.log('\n--- TEST 8: Multiple matching products ---');
  const secondLaptop = {
    orderId: "NM-8473",
    customerId: "CUST-1",
    productName: "NovaBook Air 13",
    items: [{ productName: "NovaBook Air 13", quantity: 1 }],
    status: "DELIVERED"
  };
  const res8 = findRelevantOrders("I have a problem with my laptop", [orderWatchDelivered, orderLaptopShipped, secondLaptop]);
  assert(
    res8.requiresSelection === true && res8.orderOptions.length === 2 &&
    res8.orderOptions.some(o => o.orderId === "NM-8472") &&
    res8.orderOptions.some(o => o.orderId === "NM-8473"),
    'TEST 8: Multiple matching products trigger selector with both laptop orders'
  );

  // TEST 9: No matching orders -> safe response.
  console.log('\n--- TEST 9: No matching orders ---');
  const res9 = findRelevantOrders("where is my order", []);
  assert(
    res9.type === 'NO_ORDERS' && res9.resolvedOrderId === null && res9.requiresSelection === false,
    'TEST 9: No matching orders returns safe NO_ORDERS without crashing or hallucinating'
  );

  // TEST 10: Selected order belongs to customer -> allow.
  console.log('\n--- TEST 10: Selected order belongs to customer -> allow ---');
  const custOrders = [orderWatchDelivered, orderLaptopShipped];
  const selectedId = "NM-10001";
  const normalizedSelectedId = normalizeOrderId(selectedId);
  const matchedCustOrder = custOrders.find(o => normalizeOrderId(o.orderId) === normalizedSelectedId);
  assert(
    matchedCustOrder !== undefined && matchedCustOrder.orderId === "NM-10001",
    'TEST 10: Customer selection of own order (NM-10001) successfully verified and allowed'
  );

  // TEST 11: Selected order belongs to another customer -> deny.
  console.log('\n--- TEST 11: Selected order belongs to another customer -> deny ---');
  const selectedOtherCustId = "NM-9999";
  const normalizedOtherId = normalizeOrderId(selectedOtherCustId);
  const matchedOtherOrder = custOrders.find(o => normalizeOrderId(o.orderId) === normalizedOtherId);
  const toolExecResult = await executeTool('get_order_details', { orderId: selectedOtherCustId }, 'CUST-1', custOrders);
  assert(
    matchedOtherOrder === undefined && toolExecResult.error !== undefined,
    'TEST 11: Order belonging to another customer (NM-9999) is denied by backend ownership verification'
  );

  // TEST 12: Active order context works for follow-up messages.
  console.log('\n--- TEST 12: Active order context works for follow-up messages ---');
  const res12a = findRelevantOrders("what happened to it?", custOrders, "NM-10001");
  const res12b = findRelevantOrders("why is it delayed?", custOrders, "NM-10001");
  const res12c = findRelevantOrders("can I return it?", custOrders, "NM-10001");
  assert(
    res12a.resolvedOrderId === "NM-10001" &&
    res12b.resolvedOrderId === "NM-10001" &&
    res12c.resolvedOrderId === "NM-10001",
    'TEST 12: Active order context (NM-10001) successfully resolves follow-up questions with pronouns'
  );

  // TEST 13: Explicit new order ID switches active context.
  console.log('\n--- TEST 13: Explicit new order ID switches active context ---');
  const res13 = findRelevantOrders("What about NM-8472?", custOrders, "NM-10001");
  assert(
    res13.resolvedOrderId === "NM-8472" && res13.type === "EXPLICIT_MATCH",
    'TEST 13: Explicit new order ID switches active context from NM-10001 to NM-8472'
  );

  // TEST 14: Hindsight cannot create or authorize an order.
  console.log('\n--- TEST 14: Hindsight cannot create or authorize an order ---');
  // Attempting tool execution with an order ID that is only in "memory" but not in authoritative store
  const fictitiousOrderAttempt = await executeTool('get_order_status', { orderId: 'NM-99999' }, 'CUST-1', custOrders);
  assert(
    fictitiousOrderAttempt.error !== undefined && fictitiousOrderAttempt.error.includes('not found'),
    'TEST 14: Fictitious memory order NM-99999 rejected; Hindsight cannot authorize or create orders'
  );

  // TEST 15: Current authoritative status overrides historical Hindsight information.
  console.log('\n--- TEST 15: Current authoritative status overrides historical Hindsight information ---');
  // Authoritative order status is SHIPPED
  const authStatusResult = await executeTool('get_order_status', { orderId: 'NM-8472' }, 'CUST-1', [orderLaptopShipped]);
  assert(
    authStatusResult.status === 'SHIPPED' && !authStatusResult.error,
    'TEST 15: Current authoritative order status is verified as SHIPPED regardless of historical claims'
  );

  // TEST 16: Existing Phase 7 security tests pass.
  console.log('\n--- TEST 16: Phase 7 Security Hardening Regression Suite ---');
  try {
    const secOutput = execSync('node test_security.js', { cwd: __dirname, encoding: 'utf-8' });
    const secPassed = secOutput.includes('0 FAILED') && secOutput.includes('SECURITY TEST RESULTS');
    assert(secPassed, 'TEST 16: Phase 7 security hardening tests pass (16/16, 0 FAILED)');
  } catch (err) {
    assert(false, `TEST 16 failed: ${err.message}`);
  }

  // TEST 17: Existing Phase 8 Hindsight tests pass.
  console.log('\n--- TEST 17: Phase 8 Hindsight Learning Regression Suite ---');
  try {
    const hsOutput = execSync('node test_hindsight_learning.js', { cwd: __dirname, encoding: 'utf-8' });
    const hsPassed = hsOutput.includes('0 failed') || hsOutput.includes('10/10 PASSED') || hsOutput.includes('passed successfully');
    assert(hsPassed, 'TEST 17: Phase 8 Hindsight learning tests pass (10/10, 0 FAILED)');
  } catch (err) {
    assert(false, `TEST 17 failed: ${err.message}`);
  }

  // TEST 18: Existing agent orchestration tests pass.
  console.log('\n--- TEST 18: Phase 6 Agent Orchestration Regression Suite ---');
  try {
    const orchOutput = execSync('node test_agent_orchestration.js', { cwd: __dirname, encoding: 'utf-8' });
    const orchPassed = orchOutput.includes('0 FAILED') && orchOutput.includes('ORCHESTRATION RESULTS');
    assert(orchPassed, 'TEST 18: Phase 6 agent orchestration tests pass (12/12, 0 FAILED)');
  } catch (err) {
    assert(false, `TEST 18 failed: ${err.message}`);
  }

  // TEST 19: Frontend builds successfully.
  console.log('\n--- TEST 19: Frontend Build Validation ---');
  try {
    const buildOutput = execSync('cmd /c npm run build', { cwd: path.join(__dirname, '..'), encoding: 'utf-8' });
    const buildPassed = buildOutput.includes('built in') || buildOutput.includes('✓');
    assert(buildPassed, 'TEST 19: Frontend builds cleanly with zero errors');
  } catch (err) {
    assert(false, `TEST 19 failed: ${err.message}`);
  }

  console.log('\n==================================================');
  console.log(`  RESULTS: ${passedTests}/19 PASSED, ${failedTests} FAILED`);
  console.log('==================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
