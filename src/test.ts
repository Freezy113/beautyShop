import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint works' });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});