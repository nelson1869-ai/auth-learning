import app from './app.ts';

const PORT = 3000;

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang Ctrl+C
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
