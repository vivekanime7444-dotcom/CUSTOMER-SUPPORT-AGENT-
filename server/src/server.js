// Vercel-compatible entry point
// - On Vercel: dotenv is skipped (env vars injected by platform), app is exported
// - Locally: dotenv loads .env, app.listen() starts the server

// Load .env only in non-Vercel environments (Vercel sets VERCEL=1 automatically)
if (!process.env.VERCEL) {
  require('dotenv').config();
}

const app = require('./app');

// For local dev: start the HTTP server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`V MART Support API running on port ${PORT}`);
  });
}

// For Vercel: export the Express app as a serverless handler
module.exports = app;
