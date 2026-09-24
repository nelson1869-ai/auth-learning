import express from 'express';

const app = express();
const PORT = 3000;

app.get('/api/health', (req, res) => {
    //   res.json({ status: 'ok' });
    res.json({ status: 'ok', time: new Date().toISOString() });

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

});
