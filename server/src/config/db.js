import mongoose from 'mongoose';
import env from './env.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connect to MongoDB with retry logic.
 * Retries up to `maxRetries` times with a delay between attempts.
 */
async function connectDB({ maxRetries = 5, retryDelay = 5000 } = {}) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`[DB] Connection attempt ${attempt}/${maxRetries}…`);

      await mongoose.connect(env.MONGO_URI);

      console.log('[DB] ✅ Connected to MongoDB');
      break;
    } catch (err) {
      console.error(`[DB] ❌ Attempt ${attempt} failed: ${err.message}`);

      if (attempt >= maxRetries) {
        console.error('[DB] All connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      console.log(`[DB] Retrying in ${retryDelay / 1000}s…`);
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  // Connection event listeners
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] ⚠️  Disconnected from MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] Connection error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] 🔄 Reconnected to MongoDB');
  });
}

export default connectDB;
