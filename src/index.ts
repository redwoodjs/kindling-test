import express from 'express';
import { greetingHandler } from './routes/greeting.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/greeting', greetingHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
