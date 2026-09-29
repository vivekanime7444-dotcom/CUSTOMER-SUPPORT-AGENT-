const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const memoryRoutes = require('./routes/memory');
const { checkHealth: checkHindsightHealth } = require('./services/hindsightService');

const app = express();

// Configurable CORS supporting local dev ports
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server or postman)
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        hostname.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
    } catch {
      // invalid URL origin, fallback check
      if (allowedOrigins.includes(origin)) return callback(null, true);
    }
    return callback(null, false);
  },
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Handle Invalid JSON errors nicely
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      throw Error('invalid JSON');
    }
  }
}));

// Health Check
app.get('/api/health', async (req, res) => {
  const hindsightHealth = await checkHindsightHealth();
  res.json({
    status: 'ok',
    service: 'nova-mart-support-api',
    hindsight: hindsightHealth
  });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);

// Unknown route handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  // If the error was already handled by the verify function, skip sending it again
  if (err.message === 'invalid JSON') return;
  
  console.error(err.stack);
  res.status(500).json({
    error: 'An internal server error occurred.'
  });
});

module.exports = app;
