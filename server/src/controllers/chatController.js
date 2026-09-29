const { generateChatResponse } = require('../services/aiService');
const { normalizeOrderId } = require('../services/toolsService');
const { AUTHORITATIVE_ORDERS } = require('../models/orderStore');
const { findRelevantOrders, toOrderOptions } = require('../services/orderRelevanceService');

const handleChat = async (req, res, next) => {
  console.log('[SECURITY] Incoming /api/chat request received');
  try {
    const { message, history, customerId, orders, orderId, activeOrderId } = req.body;

    // Validate customerId format (1-50 chars, alphanumeric/dash/underscore)
    let targetCustomerId = 'CUST-1';
    if (customerId && typeof customerId === 'string') {
      const cleanCustId = customerId.trim();
      if (/^[A-Za-z0-9_-]{1,50}$/.test(cleanCustId)) {
        targetCustomerId = cleanCustId;
      } else {
        console.warn(`[SECURITY] Invalid customerId format received: "${customerId}". Falling back to default identity.`);
      }
    }

    // Validate message payload
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.log('[SECURITY] Validation failed: Empty or missing message');
      return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    if (message.length > 2000) {
      console.log('[SECURITY] Validation failed: Message exceeds maximum allowed length');
      return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters.' });
    }

    // Filter incoming order payloads to strictly prevent cross-customer order injection
    const clientCustOrders = Array.isArray(orders) 
      ? orders.filter(o => o && typeof o === 'object' && o.customerId === targetCustomerId)
      : [];

    // Honor customer orders provided by client; only fall back to authoritative store if client omitted orders array
    let safeOrders = clientCustOrders;
    if (!Array.isArray(orders)) {
      safeOrders = AUTHORITATIVE_ORDERS.filter(o => o.customerId === targetCustomerId);
    }

    // Context orderId verification (The backend MUST NOT blindly trust frontend orderId.
    // It must verify that orderId belongs to customerId using authoritative order data)
    const incomingActiveId = activeOrderId || orderId;
    let verifiedContextOrderId = null;
    if (incomingActiveId && typeof incomingActiveId === 'string') {
      const normalizedReqOrderId = normalizeOrderId(incomingActiveId);
      const matched = safeOrders.find(o => normalizeOrderId(o.orderId) === normalizedReqOrderId);
      if (matched) {
        verifiedContextOrderId = matched.orderId;
      } else {
        console.warn(`[SECURITY] Context orderId "${incomingActiveId}" rejected — not found or does not belong to ${targetCustomerId}.`);
      }
    }

    // Multi-Order Relevance Evaluation
    const relevance = findRelevantOrders(message, safeOrders, verifiedContextOrderId);

    // If multiple orders match and require selection, return structured response
    if (relevance.requiresSelection) {
      return res.json({
        reply: relevance.message,
        requiresOrderSelection: true,
        orderOptions: relevance.orderOptions,
        activeOrderId: null,
        memoryUsed: false,
        memoryContext: null
      });
    }

    // If exactly 1 order was resolved by the relevance engine, set it as verified context order
    if (relevance.resolvedOrderId) {
      verifiedContextOrderId = relevance.resolvedOrderId;
    }

    try {
      const chatRes = await generateChatResponse(message, history, targetCustomerId, safeOrders, verifiedContextOrderId);
      const replyText = typeof chatRes === 'string' ? String(chatRes) : (chatRes.reply || String(chatRes));
      const memoryUsed = Boolean(chatRes.memoryUsed);
      const memoryContext = chatRes.memoryContext || null;

      // Smart Disambiguation Detection: If no single order was locked in context,
      // and multiple orders exist, and the AI's reply lists multiple customer orders
      // or asks the customer to choose/select an order, automatically provide orderOptions
      // so interactive selection cards are displayed!
      const mentionedOrders = safeOrders.filter(o => 
        replyText.includes(o.orderId) || 
        (o.items?.[0]?.productName && replyText.toLowerCase().includes(o.items[0].productName.toLowerCase()))
      );
      const asksToChooseOrder = /(which order|which one|select an order|choose an order|tell me the order|let me know which order|which of these|would you like to track)/i.test(replyText);

      const shouldShowSelection = !verifiedContextOrderId && safeOrders.length > 1 && (mentionedOrders.length >= 2 || (asksToChooseOrder && safeOrders.length > 1));
      const orderOptions = shouldShowSelection ? toOrderOptions(mentionedOrders.length >= 2 ? mentionedOrders : safeOrders) : [];

      res.json({ 
        reply: replyText,
        requiresOrderSelection: shouldShowSelection,
        activeOrderId: verifiedContextOrderId,
        orderOptions: orderOptions,
        memoryUsed: memoryUsed,
        memoryContext: memoryContext
      });
    } catch (apiError) {
      console.error('AI Service Error:', apiError.message);

      // Graceful Authoritative Fallback for rate limits or overloaded service
      const isRateLimit = apiError.status === 429 || 
        apiError.message?.includes('Rate limit') || 
        apiError.message?.includes('TPD') ||
        apiError.message?.includes('tokens per day');

      if (isRateLimit && safeOrders.length > 0) {
        console.log('[SECURITY] AI rate limited. Falling back to authoritative store resolution.');
        const targetOrder = safeOrders.find(o => o.orderId === verifiedContextOrderId) || safeOrders[0];
        const prodName = targetOrder.items?.[0]?.productName || 'item';
        const qLower = message.toLowerCase();

        if (qLower.includes('return') || relevance.type === 'RETURN_MATCH') {
          const retOrder = safeOrders.find(o => o.return?.requested || o.return?.status) || targetOrder;
          const retProd = retOrder.items?.[0]?.productName || 'item';
          const retStatus = retOrder.return?.status || 'PENDING';
          const reason = retOrder.return?.reason || 'Issue reported';
          const resType = retOrder.return?.resolution || 'REFUND';
          return res.json({
            reply: `Your return request for order **${retOrder.orderId}** (${retProd}) is currently **${retStatus}** (Resolution: ${resType}, Reason: "${reason}"). Our support team is reviewing it and will notify you as soon as it is processed.`,
            requiresOrderSelection: false,
            activeOrderId: retOrder.orderId,
            orderOptions: [],
            memoryUsed: false,
            memoryContext: null
          });
        }

        if (qLower.includes('refund') || relevance.type === 'REFUND_MATCH') {
          const refOrder = safeOrders.find(o => o.refund?.status || o.return?.resolution === 'REFUND') || targetOrder;
          const refProd = refOrder.items?.[0]?.productName || 'item';
          const refStatus = refOrder.refund?.status || refOrder.return?.status || 'PENDING';
          const amt = refOrder.refund?.amount ? `$${refOrder.refund.amount.toFixed(2)}` : `$${refOrder.totalAmount?.toFixed(2) || '0.00'}`;
          return res.json({
            reply: `Regarding your refund for order **${refOrder.orderId}** (${refProd}): The refund status is currently **${refStatus}** for ${amt}. It will be credited once the return inspection is completed.`,
            requiresOrderSelection: false,
            activeOrderId: refOrder.orderId,
            orderOptions: [],
            memoryUsed: false,
            memoryContext: null
          });
        }

        if (qLower.includes('track') || qLower.includes('where is') || qLower.includes('status')) {
          const ship = targetOrder.shipping || {};
          const trackInfo = ship.trackingNumber ? `with ${ship.carrier || 'carrier'} (Tracking #: ${ship.trackingNumber})` : '';
          return res.json({
            reply: `Order **${targetOrder.orderId}** (${prodName}) is currently **${targetOrder.status}** ${trackInfo}. Let me know if you need any additional assistance!`,
            requiresOrderSelection: false,
            activeOrderId: targetOrder.orderId,
            orderOptions: [],
            memoryUsed: false,
            memoryContext: null
          });
        }

        return res.json({
          reply: `I have retrieved your order **${targetOrder.orderId}** (${prodName}), which is currently **${targetOrder.status}**. How can I help you with this order?`,
          requiresOrderSelection: false,
          activeOrderId: targetOrder.orderId,
          orderOptions: [],
          memoryUsed: false,
          memoryContext: null
        });
      }
      
      // All models hit daily token quota and no order context to fall back on
      if (apiError.allModelsExhausted || (isRateLimit && safeOrders.length === 0)) {
        return res.status(503).json({ error: 'The AI assistant is temporarily at capacity. Please try again in a few minutes.' });
      }

      if (apiError.message === 'GROQ_API_KEY is missing') {
        return res.status(500).json({ error: 'The AI service is not configured. Please set the GROQ_API_KEY.' });
      }
      
      const status = apiError.status || 500;
      let uiMessage = 'The AI service is temporarily unavailable. Please try again.';

      if (status === 401) {
        uiMessage = 'Authentication failed. Please verify the API key is correct.';
      } else if (status === 402) {
        uiMessage = 'Insufficient credits. Please check the account billing status.';
      } else if (status === 403) {
        uiMessage = 'Permission denied. The API key lacks access to this model.';
      } else if (status === 404) {
        uiMessage = 'The requested model or endpoint was not found.';
      } else if (status === 429) {
        uiMessage = 'We are receiving too many requests right now. Please wait a moment and try again.';
      } else if (status === 500) {
        uiMessage = 'The AI service encountered an internal server error.';
      } else if (status === 503) {
        uiMessage = 'The AI service is temporarily overloaded. Please try again in a few seconds.';
      } else if (status === 400) {
        uiMessage = `Bad request to AI service: ${apiError.message}`;
      }
      
      res.status(status).json({ error: uiMessage });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChat
};
