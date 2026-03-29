import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables from .env file
dotenv.config();

const app = createApp();
const port = process.env.BACKEND_PORT || 3001;

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
}); 