import express from 'express';

const app = express();
const PORT = 3000;

// Health check — para malaman ng monitoring at deploy kung buhay ang server.
// Kasama ang `time` para makitang bagong sagot ito, hindi lumang kopya (cache).
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang Ctrl+C
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
