/**
 * Memory Controller
 * 
 * Handles HTTP requests for Hindsight memory operations.
 * Acts as the API boundary — validates input, calls the service, returns responses.
 * Never exposes Hindsight internals or credentials to the frontend.
 */

const { retainMemory, recallMemory, reflectMemory } = require('../services/hindsightService');

/**
 * POST /api/memory/retain
 * Body: { customerId, content }
 */
const handleRetain = async (req, res, next) => {
  try {
    const { customerId, content } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'customerId is required' });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }

    const result = await retainMemory(customerId, content);

    if (result === null) {
      return res.json({ 
        success: false, 
        message: 'Memory service unavailable. Operation skipped.' 
      });
    }

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/memory/recall
 * Body: { customerId, query }
 */
const handleRecall = async (req, res, next) => {
  try {
    const { customerId, query } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'customerId is required' });
    }
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query is required and must be a non-empty string' });
    }

    const result = await recallMemory(customerId, query);

    if (result === null) {
      return res.json({ 
        success: true, 
        memories: [],
        message: 'Memory service unavailable. No memories retrieved.' 
      });
    }

    res.json({ success: true, memories: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/memory/reflect
 * Body: { customerId, query }
 */
const handleReflect = async (req, res, next) => {
  try {
    const { customerId, query } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'customerId is required' });
    }
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'query is required and must be a non-empty string' });
    }

    const result = await reflectMemory(customerId, query);

    if (result === null) {
      return res.json({ 
        success: true, 
        reflection: null,
        message: 'Reflect not available.' 
      });
    }

    res.json({ success: true, reflection: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleRetain,
  handleRecall,
  handleReflect
};
