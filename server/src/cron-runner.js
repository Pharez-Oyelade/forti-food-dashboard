import cron from 'node-cron';
import { runAllAutomations } from './services/automation.service.js';
import { generateWeeklySnapshot } from './services/snapshot.service.js';

export function initLocalCrons() {
  // Only run local crons if we are NOT in a Vercel environment
  if (process.env.VERCEL) {
    console.log('[Cron] Running on Vercel. Native Vercel crons will be used.');
    return;
  }

  console.log('[Cron] Initializing local node-cron jobs for development/VPS hosting...');

  // Daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Local Cron] Running daily automations...');
    try {
      await runAllAutomations();
      console.log('[Local Cron] Daily automations complete.');
    } catch (err) {
      console.error('[Local Cron] Daily automations failed:', err);
    }
  });

  // Weekly on Friday at 11:59 PM (or adjust to match your preference)
  cron.schedule('59 23 * * 5', async () => {
    console.log('[Local Cron] Running weekly snapshot...');
    try {
      await generateWeeklySnapshot();
      console.log('[Local Cron] Weekly snapshot complete.');
    } catch (err) {
      console.error('[Local Cron] Weekly snapshot failed:', err);
    }
  });
}
