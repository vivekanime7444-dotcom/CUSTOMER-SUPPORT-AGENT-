/**
 * NOVA MART Business Tools Service
 * 
 * Provides verified business tools for the AI agent to query catalog,
 * check customer profile, inspect order lifecycle, track shipments, check
 * return/refund/replacement status, and submit formal cancellation/return requests.
 * 
 * ALL tools strictly enforce customer identity isolation: Customer A cannot access
 * Customer B's orders or details.
 * 
 * Authoritative source: Tool results reflect ground truth and override historical memory.
 */

const { PRODUCTS } = require('../../../src/mockData');

/**
 * Safely normalize an Order ID for formatting (e.g. stripping leading '#' display mark, trimming).
 * Does NOT invent an ID or guess malformed prefixes.
 */
const normalizeOrderId = (orderId) => {
  if (!orderId) return null;
  let clean = String(orderId).trim();
  // Safe formatting normalization: Strip display prefix '#' (e.g. #NM-8472 -> NM-8472)
  if (clean.startsWith('#')) {
    clean = clean.substring(1).trim();
  }
  return clean.toUpperCase();
};

/**
 * Filter orders strictly belonging to a specific customer ID.
 */
const getCustomerOrdersInternal = (customerId, orders = []) => {
  if (!customerId) return [];
  return (orders || []).filter(o => o.customerId === customerId);
};

/**
 * Safely find an order by orderId belonging to customerId.
 * Enforces strict customer isolation and input sanitization.
 */
const getOrderForCustomer = (orderId, customerId, orders = []) => {
  if (!orderId || !customerId) return null;
  
  const cleanOrderId = normalizeOrderId(orderId);
  const cleanCustId = String(customerId).trim();

  // Validate format to reject malformed inputs
  if (!cleanOrderId || !/^[A-Za-z0-9_-]{1,50}$/.test(cleanOrderId)) {
    return null;
  }

  return (orders || []).find(o => 
    normalizeOrderId(o.orderId) === cleanOrderId && o.customerId === cleanCustId
  );
};

/**
 * Centralized Order Resolver:
 * Resolves an order by ID, or auto-matches if customer has exactly ONE order.
 * If multiple orders exist and no ID is provided, returns ambiguous clarification.
 * If zero orders exist, returns safe not found response.
 */
const resolveCustomerOrder = (orderId, customerId, orders = [], filterFn = null) => {
  const custOrders = getCustomerOrdersInternal(customerId, orders);

  if (orderId) {
    const cleanId = normalizeOrderId(orderId);
    if (!cleanId || !/^[A-Za-z0-9_-]{1,50}$/.test(cleanId)) {
      return { error: 'invalid order ID format.' };
    }
    const order = getOrderForCustomer(cleanId, customerId, orders);
    if (!order) {
      return { error: `Order ${orderId} not found or access denied for customer ${customerId}.` };
    }
    return { order };
  }

  // No orderId provided:
  if (custOrders.length === 1) {
    return { order: custOrders[0], autoResolved: true };
  } else if (custOrders.length > 1) {
    // If a candidate filter is provided, check if exactly 1 order matches the criteria
    if (typeof filterFn === 'function') {
      const candidates = custOrders.filter(filterFn);
      if (candidates.length === 1) {
        return { order: candidates[0], autoResolved: true };
      }
    }
    return {
      ambiguous: true,
      message: 'Multiple orders exist for this customer. Please specify which order ID.',
      availableOrderIds: custOrders.map(o => o.orderId)
    };
  } else {
    return { error: 'No orders found for this customer.' };
  }
};

/**
 * TOOL IMPLEMENTATIONS
 */

const get_customer_profile = async ({ customerId }) => {
  if (!customerId || !/^[A-Za-z0-9_-]{1,50}$/.test(String(customerId).trim())) {
    return { error: 'Invalid customer ID format.' };
  }
  return {
    customerId: customerId,
    name: customerId === 'CUST-1' ? 'Test Customer' : `Customer ${customerId}`,
    accountStatus: 'ACTIVE',
    verified: true
  };
};

const get_customer_orders = async ({ customerId }, orders = []) => {
  if (!customerId || !/^[A-Za-z0-9_-]{1,50}$/.test(String(customerId).trim())) {
    return { error: 'Invalid customer ID format.' };
  }
  const custOrders = getCustomerOrdersInternal(customerId, orders);
  if (custOrders.length === 0) {
    return { customerId, message: 'No orders found for this customer.', orders: [] };
  }
  return {
    customerId,
    orderCount: custOrders.length,
    orders: custOrders.map(o => ({
      orderId: o.orderId,
      orderDate: o.orderDate,
      totalAmount: o.totalAmount,
      status: o.status,
      itemCount: o.items ? o.items.length : 0
    }))
  };
};

const get_order_details = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders);
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;
  return resolved.order;
};

const get_order_status = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders);
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const o = resolved.order;
  return {
    orderId: o.orderId,
    status: o.status,
    orderDate: o.orderDate,
    totalAmount: o.totalAmount,
    confirmation: o.confirmation,
    processing: o.processing,
    ...(resolved.autoResolved ? { note: 'Automatically matched customer single active order.' } : {})
  };
};

const get_tracking = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY');
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const o = resolved.order;
  return {
    orderId: o.orderId,
    status: o.status,
    shipping: o.shipping,
    delivery: o.delivery,
    trackingEvents: o.trackingEvents || [],
    ...(resolved.autoResolved ? { note: 'Automatically matched customer single active order.' } : {})
  };
};

const get_return_status = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.return?.requested || o.return?.status === 'PENDING');
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const o = resolved.order;
  return {
    orderId: o.orderId,
    returnDetails: o.return || { requested: false, status: 'NONE' },
    status: o.status,
    ...(resolved.autoResolved ? { note: 'Automatically matched customer single active order.' } : {})
  };
};

const get_refund_status = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.refund?.status === 'PENDING' || o.refund?.status === 'COMPLETED' || (o.return?.requested && o.return?.resolution === 'REFUND'));
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const o = resolved.order;
  return {
    orderId: o.orderId,
    refundDetails: o.refund || { status: 'NONE', amount: 0 },
    status: o.status,
    ...(resolved.autoResolved ? { note: 'Automatically matched customer single active order.' } : {})
  };
};

const get_replacement_status = async ({ orderId, customerId }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.replacement?.requested || (o.return?.requested && o.return?.resolution === 'REPLACEMENT'));
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const o = resolved.order;
  return {
    orderId: o.orderId,
    replacementDetails: o.replacement || { requested: false, status: 'NONE' },
    shipping: o.shipping,
    status: o.status,
    ...(resolved.autoResolved ? { note: 'Automatically matched customer single active order.' } : {})
  };
};

const get_product = async ({ productId, query }) => {
  if (productId) {
    const p = PRODUCTS.find(prod => prod.id === productId);
    if (p) return p;
  }
  if (query) {
    const qLower = String(query).toLowerCase();
    const matches = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(qLower) || 
      p.category.toLowerCase().includes(qLower) ||
      p.description.toLowerCase().includes(qLower)
    );
    if (matches.length > 0) return { count: matches.length, products: matches };
  }
  return { error: 'Product not found', availableProducts: PRODUCTS.map(p => ({ id: p.id, name: p.name, price: p.price })) };
};

/**
 * Formal Workflow Actions (Initiates request through approval pipeline, does NOT directly override order status)
 */
const request_cancellation = async ({ orderId, customerId, reason }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.status === 'ORDER_PLACED' || o.status === 'CONFIRMED' || o.status === 'PROCESSING');
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const order = resolved.order;
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    return {
      success: false,
      message: `Order ${order.orderId} has already been ${order.status.toLowerCase()} and cannot be directly cancelled. You may request a return upon delivery.`
    };
  }
  const cleanReason = typeof reason === 'string' && reason.trim() !== '' 
    ? reason.trim().substring(0, 500) 
    : 'Customer requested via support chat';

  // Initiate cancellation request
  order.cancellation = {
    requested: true,
    requestedAt: new Date().toLocaleString(),
    reason: cleanReason,
    status: 'PENDING_ADMIN_REVIEW'
  };
  return {
    success: true,
    message: `Cancellation request for order ${order.orderId} has been submitted for Admin approval.`,
    cancellationStatus: order.cancellation
  };
};

const request_return = async ({ orderId, customerId, reason, resolution }, orders = []) => {
  const resolved = resolveCustomerOrder(orderId, customerId, orders, o => o.status === 'DELIVERED');
  if (resolved.error) return { error: resolved.error };
  if (resolved.ambiguous) return resolved;

  const order = resolved.order;
  if (order.status !== 'DELIVERED') {
    return {
      success: false,
      message: `Order ${order.orderId} is currently ${order.status.replace(/_/g, ' ')}. It must be delivered before a return or refund/replacement can be requested.`
    };
  }

  const cleanReason = typeof reason === 'string' && reason.trim() !== '' 
    ? reason.trim().substring(0, 500) 
    : 'Customer reported issue';
  
  const cleanRes = String(resolution).toUpperCase() === 'REFUND' ? 'REFUND' : 'REPLACEMENT';

  order.return = {
    requested: true,
    requestedAt: new Date().toLocaleString(),
    reason: cleanReason,
    resolution: cleanRes, // REPLACEMENT or REFUND
    status: 'PENDING_ADMIN_REVIEW'
  };
  return {
    success: true,
    message: `Return/replacement request for order ${order.orderId} submitted successfully for Admin review.`,
    returnStatus: order.return
  };
};

/**
 * Tool Registry Map for tool execution
 */
const TOOL_MAP = {
  get_customer_profile,
  get_customer_orders,
  get_order_details,
  get_order_status,
  get_tracking,
  get_return_status,
  get_refund_status,
  get_replacement_status,
  get_product,
  request_cancellation,
  request_return
};

/**
 * Tool Schema Definitions for Groq Function Calling
 */
const AGENT_TOOLS_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_orders',
      description: 'Get all orders placed by the current customer. Call this first when user asks "where is my order" or about their orders without specifying an ID.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Get full details of an order. If orderId is omitted, automatically resolves single active order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Check current order status, confirmation, and processing stage. If orderId is omitted, automatically checks single active order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_tracking',
      description: 'Get shipping carrier, tracking number, estimated delivery date, and tracking events for an order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_refund_status',
      description: 'Get refund status and amount for an order. If orderId is omitted, checks single active order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_replacement_status',
      description: 'Get replacement request status and tracking for a replaced item. If orderId is omitted, checks single active order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_product',
      description: 'Search catalog or get details about a V MART product (price, stock, specs).',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Product ID (e.g. p1, p2)' },
          query: { type: 'string', description: 'Search term or product name' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_cancellation',
      description: 'Initiate a cancellation request for an eligible order (pending admin approval).',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' },
          reason: { type: 'string', description: 'Reason for cancellation' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_return',
      description: 'Submit a return or replacement request for a delivered order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Canonical Order ID (e.g. NM-8472). Do NOT prepend ID or include #.' },
          customerId: { type: 'string', description: 'Customer ID' },
          reason: { type: 'string', description: 'Reason for return/replacement' },
          resolution: { type: 'string', enum: ['REPLACEMENT', 'REFUND'], description: 'Desired resolution' }
        },
        required: ['customerId']
      }
    }
  }
];

/**
 * Execute a tool safely by name with argument validation and customer isolation.
 */
const executeTool = async (toolName, toolArgs, customerId, orders = []) => {
  const fn = TOOL_MAP[toolName];
  if (!fn) {
    return { error: `Tool "${toolName}" is not registered or supported.` };
  }

  try {
    // Inject customerId into tool args to ensure strict customer isolation
    const safeArgs = { ...toolArgs, customerId };
    console.log(`[TOOLS_SERVICE] Executing tool "${toolName}" for customer ${customerId}:`, safeArgs);
    const result = await fn(safeArgs, orders);
    return result;
  } catch (err) {
    console.error(`[TOOLS_SERVICE] Tool execution error (${toolName}):`, err.message);
    return { error: `Failed to execute tool ${toolName}: ${err.message}` };
  }
};

module.exports = {
  TOOL_MAP,
  AGENT_TOOLS_SCHEMAS,
  executeTool,
  normalizeOrderId,
  resolveCustomerOrder,
  get_customer_profile,
  get_customer_orders,
  get_order_details,
  get_order_status,
  get_tracking,
  get_return_status,
  get_refund_status,
  get_replacement_status,
  get_product,
  request_cancellation,
  request_return
};
