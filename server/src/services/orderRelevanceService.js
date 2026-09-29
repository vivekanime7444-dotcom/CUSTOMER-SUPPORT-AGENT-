const { normalizeOrderId } = require('./toolsService');

/**
 * Maps an authoritative order list to safe, customer-facing order selector options
 */
const toOrderOptions = (ordersList = []) => {
  return ordersList.map(o => {
    const firstItem = (o.items && o.items[0]) || {};
    const pName = firstItem.productName || o.productName || 'Order Items';
    return {
      orderId: o.orderId,
      productName: pName,
      status: o.status,
      returnStatus: o.return?.requested ? (o.return.status || 'PENDING') : null,
      refundStatus: o.refund?.status || null,
      totalAmount: o.totalAmount,
      orderDate: o.orderDate
    };
  });
};

/**
 * Extracts product keywords for an order
 */
const getProductKeywords = (order) => {
  const keywords = new Set();
  const items = order.items || [];
  
  if (order.productName) {
    order.productName.toLowerCase().split(/\s+/).forEach(w => keywords.add(w));
  }
  
  items.forEach(item => {
    if (item.productName) {
      item.productName.toLowerCase().split(/\s+/).forEach(w => keywords.add(w));
    }
  });

  // Category synonyms
  const allText = Array.from(keywords).join(' ');
  if (allText.includes('watch') || allText.includes('fit')) {
    keywords.add('smartwatch');
    keywords.add('watch');
    keywords.add('fitness');
  }
  if (allText.includes('book') || allText.includes('laptop')) {
    keywords.add('laptop');
    keywords.add('notebook');
    keywords.add('computer');
    keywords.add('pc');
  }
  if (allText.includes('phone')) {
    keywords.add('phone');
    keywords.add('smartphone');
    keywords.add('mobile');
  }
  if (allText.includes('buds') || allText.includes('headphone')) {
    keywords.add('headphones');
    keywords.add('earbuds');
    keywords.add('earphones');
    keywords.add('audio');
  }
  if (allText.includes('monitor') || allText.includes('ultraview')) {
    keywords.add('monitor');
    keywords.add('display');
  }

  return Array.from(keywords);
};

/**
 * Core Multi-Order Relevance Engine
 * Evaluates user query against customer's authorized orders
 */
const findRelevantOrders = (query = '', orders = [], activeOrderId = null) => {
  let q = String(query).trim().toLowerCase();
  
  // Normalize common user typos and phrasing variations
  q = q
    .replace(/\b(oeder|oder|ordr|orde|orderr|oreder|ord)\b/gi, 'order')
    .replace(/\b(oeders|oders|ordrs|oreders)\b/gi, 'orders')
    .replace(/\b(delivry|delivey|dlvery|delvry)\b/gi, 'delivery')
    .replace(/\b(pakage|packge|pakg|pckage)\b/gi, 'package')
    .replace(/\b(shipmnt|shippment|shiping)\b/gi, 'shipment')
    .replace(/\b(trck|trcking|traking|traxking)\b/gi, 'tracking')
    .replace(/\b(refnd|rfund)\b/gi, 'refund')
    .replace(/\b(reurn|retrn|retun)\b/gi, 'return')
    .replace(/\b(where's|wheres)\b/gi, 'where is');
  
  // 0 orders check
  if (!orders || orders.length === 0) {
    return {
      type: 'NO_ORDERS',
      resolvedOrderId: null,
      requiresSelection: false,
      matchingOrders: []
    };
  }

  // Exactly 1 order total -> always automatically resolve that single order
  if (orders.length === 1) {
    return {
      type: 'SINGLE_CUSTOMER_ORDER',
      resolvedOrderId: orders[0].orderId,
      requiresSelection: false,
      matchingOrders: orders
    };
  }

  // MULTIPLE ORDERS EXIST (orders.length > 1):

  // 1. EXPLICIT ORDER ID IN QUERY
  // Matches "NM-XXXX", "#NM-XXXX", etc.
  const explicitMatch = q.match(/\b#?(nm[-_]?\d+)\b/i);
  if (explicitMatch) {
    const rawId = explicitMatch[1];
    const cleanId = normalizeOrderId(rawId);
    const found = orders.find(o => normalizeOrderId(o.orderId) === cleanId);
    if (found) {
      return {
        type: 'EXPLICIT_MATCH',
        resolvedOrderId: found.orderId,
        requiresSelection: false,
        matchingOrders: [found]
      };
    } else {
      // Order ID explicitly specified does not belong to this customer
      return {
        type: 'EXPLICIT_UNAUTHORIZED_OR_UNKNOWN',
        resolvedOrderId: null,
        requestedOrderId: cleanId,
        requiresSelection: false,
        matchingOrders: []
      };
    }
  }

  // 2. PRODUCT-SPECIFIC QUESTION
  // Check if query specifically asks about a product (e.g. "my laptop", "problem with laptop", "my watch")
  const productMatches = orders.filter(order => {
    const kws = getProductKeywords(order);
    return kws.some(kw => {
      // Avoid generic short words matching substring
      if (kw.length <= 2) return false;
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(q);
    });
  });

  if (productMatches.length === 1) {
    return {
      type: 'PRODUCT_MATCH',
      resolvedOrderId: productMatches[0].orderId,
      requiresSelection: false,
      matchingOrders: productMatches,
      reason: `product match (${productMatches[0].items?.[0]?.productName || 'product'})`
    };
  } else if (productMatches.length > 1) {
    return {
      type: 'MULTIPLE_PRODUCT_MATCH',
      requiresSelection: true,
      orderOptions: toOrderOptions(productMatches),
      matchingOrders: productMatches,
      message: 'I found multiple orders matching that product. Which one would you like to discuss?'
    };
  }

  // 3. ACTIVE CONTEXT REFERENTIAL FOLLOW-UP
  // When an active order is in context, subsequent referential questions
  // (e.g. "what happened?", "why is it delayed?", "what about the refund?", "can I return it?", "what happened to it?")
  // continue with the active order context.
  if (activeOrderId) {
    const cleanActiveId = normalizeOrderId(activeOrderId);
    const activeOrder = orders.find(o => normalizeOrderId(o.orderId) === cleanActiveId);
    if (activeOrder) {
      const hasReferentialPronoun = /\b(it|this|that|the order|the return|the refund)\b/i.test(q);
      const isSpecificFollowupPhrase = /^(what happened(\s+to\s+(it|the return|the refund))?\??|why is it delayed\??|what about the refund\??|can i return it\??|why delayed\??|status\??|cancel it\??|where is it\??)$/i.test(q);
      const isShortFollowup = (q.length < 35 && /\b(what happened|why|delayed|cancel|details|update|status)\b/i.test(q));
      
      // Ensure we do NOT treat broad multi-order questions as referential follow-ups:
      const isBroadQuery = /^(where is my order\??|track my order\??|what happened to my return(\s+request)?\??|what happened to my refund\??|i want (a )?refund\??|my orders\??|all orders\??)$/i.test(q);

      if ((hasReferentialPronoun || isSpecificFollowupPhrase || isShortFollowup) && !isBroadQuery) {
        return {
          type: 'ACTIVE_CONTEXT_MATCH',
          resolvedOrderId: activeOrder.orderId,
          requiresSelection: false,
          matchingOrders: [activeOrder],
          reason: 'follow-up on active order context'
        };
      }
    }
  }

  // 4. RETURN / REPLACEMENT SPECIFIC QUESTIONS
  const isReturnQuery = /\b(return|returned|returning|replacement|replace|exchange)\b/i.test(q);
  if (isReturnQuery) {
    const returnOrders = orders.filter(o => 
      o.return?.requested || 
      o.return?.status === 'PENDING' || 
      o.replacement?.requested || 
      o.status === 'RETURN_REQUESTED'
    );

    if (returnOrders.length === 1) {
      return {
        type: 'RETURN_MATCH',
        resolvedOrderId: returnOrders[0].orderId,
        requiresSelection: false,
        matchingOrders: returnOrders,
        reason: 'single order with return request'
      };
    } else if (returnOrders.length > 1) {
      return {
        type: 'MULTIPLE_RETURN_MATCH',
        requiresSelection: true,
        orderOptions: toOrderOptions(returnOrders),
        matchingOrders: returnOrders,
        message: 'I found multiple orders with return requests. Which one would you like to check?'
      };
    } else {
      // No orders currently have a return request
      // If user wants to start a return or asks why no return exists
      const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
      if (deliveredOrders.length === 1) {
        return {
          type: 'RETURN_ELIGIBLE_MATCH',
          resolvedOrderId: deliveredOrders[0].orderId,
          requiresSelection: false,
          matchingOrders: deliveredOrders
        };
      } else if (deliveredOrders.length > 1) {
        return {
          type: 'MULTIPLE_RETURN_MATCH',
          requiresSelection: true,
          orderOptions: toOrderOptions(deliveredOrders),
          matchingOrders: deliveredOrders,
          message: 'Which order would you like to request a return for?'
        };
      }
    }
  }

  // 4. REFUND SPECIFIC QUESTIONS
  const isRefundQuery = /\b(refund|refunds|money back|reimbursement)\b/i.test(q);
  if (isRefundQuery) {
    // Inquiring about an existing refund
    const activeRefundOrders = orders.filter(o => 
      o.refund?.status === 'PENDING' || 
      o.refund?.status === 'COMPLETED' || 
      (o.return?.requested && o.return?.resolution === 'REFUND')
    );

    if (activeRefundOrders.length === 1) {
      return {
        type: 'REFUND_MATCH',
        resolvedOrderId: activeRefundOrders[0].orderId,
        requiresSelection: false,
        matchingOrders: activeRefundOrders,
        reason: 'single order with active refund'
      };
    } else if (activeRefundOrders.length > 1) {
      return {
        type: 'MULTIPLE_REFUND_MATCH',
        requiresSelection: true,
        orderOptions: toOrderOptions(activeRefundOrders),
        matchingOrders: activeRefundOrders,
        message: 'I found multiple orders that match your refund inquiry. Which one would you like to discuss?'
      };
    } else {
      // Requesting a new refund ("i want refund")
      const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
      if (deliveredOrders.length === 1) {
        return {
          type: 'REFUND_MATCH',
          resolvedOrderId: deliveredOrders[0].orderId,
          requiresSelection: false,
          matchingOrders: deliveredOrders,
          reason: 'single delivered order eligible for refund'
        };
      } else if (deliveredOrders.length > 1) {
        return {
          type: 'MULTIPLE_REFUND_MATCH',
          requiresSelection: true,
          orderOptions: toOrderOptions(deliveredOrders),
          matchingOrders: deliveredOrders,
          message: 'I found multiple orders that could be associated with a refund. Which order would you like to discuss?'
        };
      } else {
        // Multiple orders exist, none yet delivered
        return {
          type: 'MULTIPLE_REFUND_MATCH',
          requiresSelection: true,
          orderOptions: toOrderOptions(orders),
          matchingOrders: orders,
          message: 'Which order would you like to discuss regarding a refund?'
        };
      }
    }
  }

  // 5. TRACKING / SHIPPING SPECIFIC QUESTIONS
  const isTrackingQuery = /\b(where is|where are|track|tracking|shipment|delivery|in transit|arrive|package|status|when will|shipped|dispatched)\b/i.test(q);
  if (isTrackingQuery) {
    if (orders.length > 1) {
      return {
        type: 'MULTIPLE_TRACKING_MATCH',
        requiresSelection: true,
        orderOptions: toOrderOptions(orders),
        matchingOrders: orders,
        message: `I found ${orders.length} orders in your account. Which order would you like to check?`
      };
    }
  }

  // 6. GENERAL ORDER QUESTIONS WITH MULTIPLE ORDERS ("my orders", "show orders", "orders", etc.)
  const isGeneralOrderQuery = /\b(order|orders|package|packages|item|items|purchase|purchases)\b/i.test(q);
  if (isGeneralOrderQuery && orders.length > 1) {
    return {
      type: 'GENERAL_MULTIPLE_ORDERS',
      requiresSelection: true,
      orderOptions: toOrderOptions(orders),
      matchingOrders: orders,
      message: `You have ${orders.length} orders on file. Which one would you like to discuss?`
    };
  }

  // 7. UNRESOLVED / GENERAL QUESTION (e.g. greeting or catalog query)
  return {
    type: 'NONE',
    resolvedOrderId: null,
    requiresSelection: false,
    matchingOrders: []
  };
};

module.exports = {
  findRelevantOrders,
  toOrderOptions,
  getProductKeywords
};
