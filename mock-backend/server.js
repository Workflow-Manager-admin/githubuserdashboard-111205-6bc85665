const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware for JSON body parsing and CORS
app.use(express.json());
app.use(cors());

// PUBLIC_INTERFACE
// POST /token endpoint: accepts { code: ... } and responds with mock token
app.post('/token', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing OAuth code' });
  }
  // Simulate token (real server would verify code, etc)
  return res.json({ access_token: 'mock_access_token' });
});

// (Optional) Health check for debug
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`[MOCK-BACKEND] Listening at http://localhost:${PORT}/token`);
});
