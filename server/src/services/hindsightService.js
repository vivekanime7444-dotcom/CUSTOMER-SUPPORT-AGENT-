/**
 * Hindsight Memory Service
 * 
 * Provides a clean abstraction over the Hindsight long-term memory API.
 * All Hindsight communication goes through this service.
 * 
 * Responsibilities:
 * - Long-term customer interaction memory
 * - Previous support context
 * - Customer preferences
 * - Troubleshooting history
 * - Support outcomes
 * 
 * NOT responsible for:
 * - Current order state (owned by NOVA MART business data)
 * - Current tracking/refund/return state
 * - Product information
 * - Admin decisions
 */

const { HindsightClient } = require('@vectorize-io/hindsight-client');

// Lazy-initialized client singleton
let _client = null;
let _initError = null;

/**
 * Returns a configured HindsightClient instance, or null if not configured.
 * Hindsight is optional — NOVA MART must continue working without it.
 */
const getClient = () => {
  if (_client) return _client;
  if (_initError) return null; // Don't retry if init already failed

  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  if (!baseUrl) {
    _initError = 'HINDSIGHT_BASE_URL is not set';
    console.warn('[HINDSIGHT] HINDSIGHT_BASE_URL not configured. Memory features disabled.');
    return null;
  }

  try {
    const options = { baseUrl };

    // If using Hindsight Cloud, an API key is required
    const apiKey = process.env.HINDSIGHT_API_KEY;
    if (apiKey) {
      options.apiKey = apiKey;
    }

    _client = new HindsightClient(options);
    console.log(`[HINDSIGHT] Client initialized. Base URL: ${baseUrl}`);
    return _client;
  } catch (err) {
    _initError = err.message;
    console.error('[HINDSIGHT] Failed to initialize client:', err.message);
    return null;
  }
};

/**
 * Derives a per-customer Hindsight bank ID.
 * Ensures customer memory isolation — Customer A never sees Customer B's memories.
 * 
 * @param {string} customerId - The NOVA MART customer identifier (e.g. "CUST-1")
 * @returns {string} A unique bank ID scoped to this customer
 */
const getBankId = (customerId) => {
  if (!customerId) throw new Error('customerId is required for memory operations');
  const cleanId = String(customerId).trim().replace(/[^A-Za-z0-9_-]/g, '').substring(0, 50);
  if (!cleanId) throw new Error('Invalid customerId for memory operations');
  return `novamart-customer-${cleanId}`;
};

/**
 * RETAIN — Store a memory for a customer.
 * 
 * @param {string} customerId - NOVA MART customer ID
 * @param {string} content - The memory content to store
 * @returns {Promise<object|null>} The retain response, or null on failure
 */
const retainMemory = async (customerId, content) => {
  const client = getClient();
  if (!client) {
    console.warn('[HINDSIGHT] Retain skipped — client not available');
    return null;
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    console.warn('[HINDSIGHT] Retain skipped — empty content');
    return null;
  }

  try {
    const bankId = getBankId(customerId);
    console.log(`[HINDSIGHT] Retaining memory for bank "${bankId}", content length: ${content.length}`);
    const result = await client.retain(bankId, content);
    console.log(`[HINDSIGHT] Memory retained successfully for ${customerId}`);
    return result;
  } catch (err) {
    console.error(`[HINDSIGHT] Retain failed for ${customerId}:`, err.message);
    return null; // Fail gracefully — do not crash NOVA MART
  }
};

/**
 * RECALL — Search for relevant memories for a customer.
 * 
 * @param {string} customerId - NOVA MART customer ID
 * @param {string} query - The search query / current context
 * @returns {Promise<object|null>} The recall results, or null on failure
 */
const recallMemory = async (customerId, query) => {
  const client = getClient();
  if (!client) {
    console.warn('[HINDSIGHT] Recall skipped — client not available');
    return null;
  }

  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.warn('[HINDSIGHT] Recall skipped — empty query');
    return null;
  }

  try {
    const bankId = getBankId(customerId);
    console.log(`[HINDSIGHT] Recalling memories for bank "${bankId}", query: "${query.substring(0, 80)}..."`);
    const result = await client.recall(bankId, query);
    console.log(`[HINDSIGHT] Recall completed for ${customerId}`);
    return result;
  } catch (err) {
    console.error(`[HINDSIGHT] Recall failed for ${customerId}:`, err.message);
    return null; // Fail gracefully — return no memories rather than crash
  }
};

/**
 * REFLECT — Generate a disposition-aware response from memory.
 * Uses Hindsight's reflect operation if available.
 * 
 * @param {string} customerId - NOVA MART customer ID
 * @param {string} query - The reflection query
 * @returns {Promise<object|null>} The reflect results, or null on failure
 */
const reflectMemory = async (customerId, query) => {
  const client = getClient();
  if (!client) {
    console.warn('[HINDSIGHT] Reflect skipped — client not available');
    return null;
  }

  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.warn('[HINDSIGHT] Reflect skipped — empty query');
    return null;
  }

  // Check if the client supports reflect
  if (typeof client.reflect !== 'function') {
    console.warn('[HINDSIGHT] Reflect not supported by this client version');
    return null;
  }

  try {
    const bankId = getBankId(customerId);
    console.log(`[HINDSIGHT] Reflecting for bank "${bankId}"`);
    const result = await client.reflect(bankId, query);
    console.log(`[HINDSIGHT] Reflect completed for ${customerId}`);
    return result;
  } catch (err) {
    console.error(`[HINDSIGHT] Reflect failed for ${customerId}:`, err.message);
    return null; // Fail gracefully
  }
};

/**
 * Extracts clean memory text strings from Hindsight recall results.
 * Handles various return structures from the Hindsight SDK gracefully.
 * 
 * @param {object|array} recallResult - The raw return value from client.recall
 * @returns {string[]} Array of clean, distinct memory text strings
 */
const extractMemoryStrings = (recallResult) => {
  if (!recallResult) return [];

  let rawList = [];
  if (Array.isArray(recallResult)) {
    rawList = recallResult;
  } else if (recallResult.results) {
    if (Array.isArray(recallResult.results)) {
      rawList = recallResult.results;
    } else if (typeof recallResult.results === 'object' && Array.isArray(recallResult.results.results)) {
      rawList = recallResult.results.results;
    }
  } else if (Array.isArray(recallResult.memories)) {
    rawList = recallResult.memories;
  }

  const cleanStrings = [];
  const seen = new Set();

  for (const item of rawList) {
    let str = '';
    if (typeof item === 'string') {
      str = item;
    } else if (item && typeof item === 'object') {
      str = item.text || item.content || item.memory || item.fact || item.summary || '';
    }

    str = str.trim();
    if (str && !seen.has(str)) {
      seen.add(str);
      cleanStrings.push(str);
    }
  }

  return cleanStrings;
};

/**
 * Extracts clean, RELEVANT memory strings by filtering out low-confidence matches,
 * live authoritative order assertions, and irrelevant topics.
 * 
 * @param {object|array} recallResult - Raw recall result from Hindsight
 * @param {string} query - The current customer query
 * @returns {string[]} Filtered relevant memory strings
 */
const extractRelevantMemories = (recallResult, query = '') => {
  if (!recallResult) return [];

  let rawList = [];
  if (Array.isArray(recallResult)) {
    rawList = recallResult;
  } else if (recallResult.results) {
    if (Array.isArray(recallResult.results)) {
      rawList = recallResult.results;
    } else if (typeof recallResult.results === 'object' && Array.isArray(recallResult.results.results)) {
      rawList = recallResult.results.results;
    }
  } else if (Array.isArray(recallResult.memories)) {
    rawList = recallResult.memories;
  }

  const cleanMemories = [];
  const seen = new Set();
  const qLower = (query || '').toLowerCase().trim();

  // Pure order tracking queries rely on authoritative business data, not historical memory
  const isPureOrderStatusQuery = [
    'where is my order', 'where is my package', 'check my order', 
    'order status', 'track my order', 'track order', 'is it shipped'
  ].some(q => qLower.includes(q));

  for (const item of rawList) {
    let str = '';
    let score = null;

    if (typeof item === 'string') {
      str = item;
    } else if (item && typeof item === 'object') {
      str = item.text || item.content || item.memory || item.fact || item.summary || '';
      if (item.scores && typeof item.scores === 'object') {
        score = item.scores;
      }
    }

    str = str.trim();
    if (!str || seen.has(str)) continue;

    // Rule 1: Exclude memories that merely report live order states (authoritative business data)
    if (/^Order NM-\d+ is (currently )?(being packed|shipped|delivered|processing)/i.test(str)) {
      continue;
    }

    // Rule 2: If the query is purely about tracking/shipping status and the memory has no troubleshooting/preference, skip it
    if (isPureOrderStatusQuery && !str.toLowerCase().includes('prefer') && !str.toLowerCase().includes('troubleshoot')) {
      continue;
    }

    // Rule 3: Score threshold filtering when scores are provided by Hindsight
    if (score !== null && typeof score === 'object') {
      const finalScore = score.final ?? 0;
      const rerankerScore = score.reranker ?? 0;
      const isRelevant = finalScore >= 0.20 || rerankerScore >= 0.20;
      if (!isRelevant) {
        continue; // Discard low-similarity / irrelevant memory
      }
    } else if (typeof score === 'number') {
      if (score < 0.20) continue;
    } else if (qLower) {
      // Rule 4: If no scores exist (e.g. test mocks), perform topic relevance check
      const qWords = qLower.split(/\W+/).filter(w => w.length > 3 && !['what', 'with', 'from', 'this', 'that', 'have', 'your', 'about', 'tell', 'show', 'need'].includes(w));
      const strLower = str.toLowerCase();
      const hasTopicOverlap = qWords.some(w => strLower.includes(w));
      if (qWords.length > 0 && !hasTopicOverlap) {
        continue;
      }
    }

    seen.add(str);
    cleanMemories.push(str);
  }

  return cleanMemories;
};

/**
 * Classifies relevant memories into safe, user-friendly categories.
 * 
 * Categories:
 * - previous_troubleshooting: "Previous troubleshooting context"
 * - customer_preference: "Saved preference used"
 * - previous_support_context: "Previous support context"
 */
const classifyMemoryContext = (relevantMemories, query = '') => {
  if (!relevantMemories || relevantMemories.length === 0) {
    return { memoryUsed: false, memoryContext: null };
  }

  const combinedText = relevantMemories.join(' ').toLowerCase();
  const qLower = (query || '').toLowerCase();

  // 1. Previous Troubleshooting context
  const troubleshootingKeywords = [
    'restart', 'reboot', 'overheating', 'overheated', 'tried', 'already tried',
    'troubleshoot', 'troubleshooting', 'flicker', 'flickering', 'freeze', 'crash',
    'driver', 'cable', 'reset', 'power cycle', 'hardware'
  ];
  if (troubleshootingKeywords.some(k => combinedText.includes(k) || (qLower.includes(k) && combinedText.includes('tried')))) {
    return {
      memoryUsed: true,
      memoryContext: {
        type: 'previous_troubleshooting',
        label: 'Previous troubleshooting context'
      }
    };
  }

  // 2. Customer Preference
  const preferenceKeywords = [
    'prefer', 'preference', 'instead of refund', 'replacement instead', 'replacement over refund',
    'email notification', 'notification preference', 'express delivery', 'contact method'
  ];
  if (preferenceKeywords.some(k => combinedText.includes(k))) {
    return {
      memoryUsed: true,
      memoryContext: {
        type: 'customer_preference',
        label: 'Saved preference used'
      }
    };
  }

  // 3. General Previous Support context
  return {
    memoryUsed: true,
    memoryContext: {
      type: 'previous_support_context',
      label: 'Previous support context'
    }
  };
};

/**
 * Filter and retain high-value memory facts asynchronously.
 * 
 * Categories worth retaining:
 * 1. Customer preferences (e.g., "prefers replacement over refund", "prefers express shipping")
 * 2. Technical / Troubleshooting results (e.g., "restarting laptop did not fix overheating")
 * 3. Product preferences & recurring issues (e.g., "third time screen flickers", "router overheating")
 * 4. Stated resolution preferences
 * 
 * Categories NOT retained:
 * - Greetings ("hi", "hello", "good morning")
 * - Trivial pleasantries ("thanks", "okay", "bye")
 * - Generic order status queries ("where is my order", "check status")
 * 
 * @param {string} customerId - NOVA MART customer ID
 * @param {string} message - User message
 * @param {string} assistantReply - AI assistant response
 */
const evaluateAndRetainUsefulMemory = async (customerId, message, assistantReply) => {
  if (!customerId || !message || typeof message !== 'string') return;

  const msgLower = message.toLowerCase().trim();

  // Fast filter: Ignore short or trivial messages
  if (msgLower.length < 6) return;

  // Ignore simple greetings and pleasantries
  const trivialGreetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'thanks', 'thank you', 'ok', 'okay', 'bye', 'goodbye', 'cool'];
  if (trivialGreetings.includes(msgLower)) return;

  // Ignore simple order status lookups without contextual facts
  const pureStatusQueries = [
    'where is my order', 'where is my package', 'check my order', 
    'order status', 'is my order shipped', 'is my refund done', 'track my order'
  ];
  if (pureStatusQueries.some(q => msgLower === q || msgLower === q + '?')) return;

  // Check for memory-worthy indicators
  const indicators = [
    'prefer', 'instead of', 'already tried', 'tried restarting', 'restarted',
    'updated', 'overheating', 'broken', 'damaged', 'faulty', 'flickering',
    'again', 'second time', 'third time', 'replacement', 'refund', 'issue',
    'problem', 'failed', 'worked', 'fixed', 'does not work', "doesn't work"
  ];

  const containsUsefulInfo = indicators.some(ind => msgLower.includes(ind));

  if (!containsUsefulInfo) {
    return;
  }

  // Construct a clean, self-contained fact sentence to retain
  let factToRetain = `Customer note: "${message.trim()}"`;
  let memoryType = 'general_context';

  if (msgLower.includes('prefer')) {
    memoryType = 'customer_preference';
    factToRetain = `Customer preference: ${message.trim()}`;
  } else if (msgLower.includes('tried') || msgLower.includes('already') || msgLower.includes('restarted')) {
    memoryType = 'troubleshooting_context';
    factToRetain = `Customer troubleshooting history: ${message.trim()}`;
  } else if (msgLower.includes('again') || msgLower.includes('second time') || msgLower.includes('third time')) {
    memoryType = 'recurring_issue';
    factToRetain = `Recurring customer issue: ${message.trim()}`;
  } else if (msgLower.includes('replacement') || msgLower.includes('refund')) {
    memoryType = 'resolution_preference';
    factToRetain = `Customer resolution preference: ${message.trim()}`;
  }

  console.log(`[HINDSIGHT] MEMORY RETAINED\nCustomer: ${customerId}\nType: ${memoryType}\nSummary: ${factToRetain}`);

  // Retain asynchronously and catch errors to avoid unhandled rejections
  retainMemory(customerId, factToRetain).catch(err => {
    console.warn(`[HINDSIGHT INTELLIGENCE] Non-fatal background retain error for ${customerId}:`, err.message);
  });
};

/**
 * Check if the Hindsight service is available and reachable.
 * Used for health checks and diagnostics.
 * 
 * @returns {Promise<{available: boolean, error?: string}>}
 */
const checkHealth = async () => {
  const client = getClient();
  if (!client) {
    return { available: false, error: _initError || 'Client not configured' };
  }

  try {
    // Attempt a lightweight recall on a test bank to verify connectivity
    await client.recall('novamart-health-check', 'ping');
    return { available: true };
  } catch (err) {
    // "Bank not found" means the server IS reachable — the bank just doesn't exist yet
    if (err.message && err.message.includes('not found')) {
      return { available: true };
    }
    return { available: false, error: err.message };
  }
};

module.exports = {
  retainMemory,
  recallMemory,
  reflectMemory,
  checkHealth,
  getBankId,
  extractMemoryStrings,
  extractRelevantMemories,
  classifyMemoryContext,
  evaluateAndRetainUsefulMemory
};

