import { createApp } from './app.js';

const port = Number(process.env.PORT || 3001);
const app = await createApp();

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
