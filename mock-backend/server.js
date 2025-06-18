const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3888;

// Middleware for JSON body parsing and CORS (for local dev)
app.use(express.json());
app.use(cors());

// PUBLIC_INTERFACE
// Endpoint: Accepts POST with { code: string }, responds with { access_token: 'mock_access_token' }
app.post('/oauth/token', (req, res) => {
  // Usually: req.body.code is sent from frontend
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing OAuth code' });
  }
  // Simulate OAuth code exchange (always succeed, return a mock token)
  return res.json({
    access_token: 'mock_access_token',
    token_type: 'bearer',
    scope: 'read:user repo'
  });
});

// Health check (optional, for debug)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`[MOCK-BACKEND] OAuth code exchange server running at http://localhost:${PORT}`);
});
