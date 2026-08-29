import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

// Initialize DB connection for serverless environment
let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
