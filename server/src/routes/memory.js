const express = require('express');
const router = express.Router();
const { handleRetain, handleRecall, handleReflect } = require('../controllers/memoryController');

// POST /api/memory/retain  — Store a memory
router.post('/retain', handleRetain);

// POST /api/memory/recall  — Search memories
router.post('/recall', handleRecall);

// POST /api/memory/reflect — Reflect on memories
router.post('/reflect', handleReflect);

module.exports = router;
